import { chromium } from "@playwright/test";

const BASE = process.env.VERIFY_URL ?? "http://localhost:3100";
const browser = await chromium.launch();
const report = {};

/* 1. Every in-page anchor resolves to a real target */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  report.anchorAudit = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const issues = [];
    const targets = new Set();
    for (const a of anchors) {
      const href = a.getAttribute("href");
      if (!href) continue;
      if (href === "#") {
        issues.push("DEAD_HASH: " + a.textContent.trim());
        continue;
      }
      if (href.startsWith("#")) {
        const id = href.slice(1);
        if (document.getElementById(id)) targets.add(href);
        else issues.push(`MISSING_TARGET ${href} <- "${a.textContent.trim()}"`);
      } else if (!href.startsWith("/") && !href.startsWith("http")) {
        issues.push("ODD_HREF: " + href);
      }
    }
    return { count: anchors.length, issues, targets: Array.from(targets).sort() };
  });
  await context.close();
}

/* 2. Clicking nav / hero / footer links really navigates */
async function clickAndCheck(page, label, expectedHash) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.getByRole("link", { name: label, exact: true }).first().click();
  await page.waitForTimeout(900);
  return page.evaluate((hash) => {
    const el = document.getElementById(hash.slice(1));
    const rect = el?.getBoundingClientRect();
    return {
      urlHash: window.location.hash,
      targetExists: Boolean(el),
      targetTop: rect ? Math.round(rect.top) : null,
      scrollY: Math.round(window.scrollY),
    };
  }, expectedHash);
}

{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "networkidle" });

  report.desktopNav = {};
  for (const [label, hash] of [
    ["Home", "#hero"],
    ["Games", "#games"],
    ["Booking", "#booking"],
    ["About", "#about"],
    ["Contact", "#contact"],
    ["Explore Games", "#games"],
    ["Choose your game", "#games"],
    ["Experience", "#experience"],
    ["Stations", "#stations"],
    ["Offers", "#offers"],
    ["How it works", "#how-it-works"],
    ["Book a session", "#booking"],
  ]) {
    report.desktopNav[label] = await clickAndCheck(page, label, hash);
  }

  report.footerNav = {};
  for (const [label, hash] of [
    ["Stations", "#stations"],
    ["Book a session", "#booking"],
    ["WhatsApp", null],
  ]) {
    if (hash === null) continue;
    report.footerNav[label] = await clickAndCheck(page, label, hash);
  }

  report.desktopConsoleErrors = errors;
  await context.close();
}

/* 3. Keyboard activation of a nav link */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Stations", exact: true }).first().focus();
  const focusedText = await page.evaluate(() =>
    document.activeElement?.textContent?.trim(),
  );
  await page.keyboard.press("Enter");
  await page.waitForTimeout(900);
  report.keyboardNav = {
    focusedText,
    urlHash: await page.evaluate(() => window.location.hash),
    scrollY: await page.evaluate(() => Math.round(window.scrollY)),
  };
  await context.close();
}

/* 4. Scroll spy marks the current section */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const el = document.getElementById("stations");
    window.scrollTo(0, el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2);
  });
  await page.waitForTimeout(600);
  report.scrollSpy = await page.evaluate(() =>
    Array.from(document.querySelectorAll("nav[aria-label='Primary'] a")).map((a) => ({
      text: a.textContent.trim(),
      current: a.getAttribute("aria-current"),
      activeClass: a.className.includes("gp-nav-link-active"),
    })),
  );
  await context.close();
}

/* 5. Mobile drawer: opens, link click navigates and closes */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(400);
  const opened = await page.locator("nav[aria-label='Mobile']").isVisible();
  await page
    .getByRole("navigation", { name: "Mobile" })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await page.waitForTimeout(900);
  report.mobileDrawer = {
    opened,
    afterClickHash: await page.evaluate(() => window.location.hash),
    drawerClosed: !(await page.locator("#mobile-menu .gp-drawer").isVisible()),
    targetTop: await page.evaluate(() => {
      const el = document.getElementById("contact");
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    }),
    bodyOverflowReset: await page.evaluate(() => document.body.style.overflow || "(unset)"),
  };
  await context.close();
}

/* 6. Buttons: accessible names and real state */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  report.buttons = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button")).map((b) => ({
      name: (b.getAttribute("aria-label") ?? b.textContent ?? "").trim().slice(0, 30),
      hasExpanded: b.hasAttribute("aria-expanded"),
    })),
  );
  await context.close();
}

/* 7. Reduced motion */
{
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(500);
  report.reducedMotion = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    // ADR-008: parallax + particles EXIST but must be fully disabled under
    // reduced motion (DESIGN.md §47 + the §23/§46 amendment).
    layerTransforms: Array.from(document.querySelectorAll(".gp-hero-layer")).map(
      (l) => getComputedStyle(l).transform,
    ),
    particleCount: document.querySelectorAll(".gp-particle").length,
    particleAnimation: (() => {
      const particle = document.querySelector(".gp-particle");
      return particle ? getComputedStyle(particle).animationName : "(missing)";
    })(),
    revealOpacity: getComputedStyle(document.querySelector(".gp-reveal")).opacity,
    cardTransform: getComputedStyle(document.querySelector(".gp-game-card")).transform,
  }));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  report.reducedMotion.hiddenAfterScroll = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll(".gp-reveal")).filter(
        (el) => getComputedStyle(el).opacity === "0",
      ).length,
  );
  await context.close();
}

/* 8. Responsive overflow + database-backed content */
report.responsive = {};
for (const width of [320, 375, 768, 1024, 1280, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(600, 0));
  await page.waitForTimeout(200);
  report.responsive[width] = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scrolledX: window.scrollX,
    gameCards: document.querySelectorAll("[data-game-card]").length,
    stationCards: document.querySelectorAll("#stations li article").length,
    gameNames: Array.from(document.querySelectorAll("[data-game-card] h3")).map((h) =>
      h.textContent.trim(),
    ),
    stationNames: Array.from(document.querySelectorAll("#stations li article h3")).map((h) =>
      h.textContent.trim(),
    ),
    smallTargets: Array.from(document.querySelectorAll("a.gp-btn, button.gp-btn"))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.height < 44;
      })
      .map((el) => el.textContent.trim().slice(0, 18)),
  }));
  await context.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));