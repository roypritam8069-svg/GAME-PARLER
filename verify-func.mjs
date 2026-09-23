import { chromium } from "@playwright/test";

/**
 * Functional verification for the Game Parlour Home page
 * (owner's 23-point manual checklist, automated where possible).
 *
 * Prints a JSON report; `process.exitCode = 1` when any PASS check failed.
 */

const BASE = process.env.VERIFY_URL ?? "http://localhost:3100";
const WA_PREFIX = "https://wa.me/916294667229?text=";

/**
 * Approved rate card (prisma/seed.ts). Cards and the booking wizard must only
 * ever surface numbers from this set — anything else means a price was
 * invented (DESIGN.md §68).
 */
const APPROVED_RATES = [75, 100, 140, 180, 260, 320];

/**
 * Dev-server warm-up. `next dev` compiles each route on first hit, so the very
 * first /api/request could exceed a test timeout and fail for no real reason.
 * Hitting every route once here removes that race (checks below still assert
 * the real behaviour).
 */
for (const path of ["/", "/api/catalogue", "/api/availability?date=2099-01-01&time=10:00&durationMin=30"]) {
  try {
    await fetch(new URL(path, BASE));
  } catch {
    /* unreachable server is reported by the checks, not here */
  }
}

const browser = await chromium.launch();
const report = { checks: {}, consoleErrors: [], failed: [] };

function check(name, condition, detail) {
  report.checks[name] = { ok: Boolean(condition), detail: detail ?? null };
  if (!condition) report.failed.push(name);
}

async function newPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") report.consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => report.consoleErrors.push(String(e)));
  return { context, page };
}

/* 1. Anchors resolve, zero dead links, real external hrefs --------------- */
{
  const { context, page } = await newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const audit = await page.evaluate(() => {
    const issues = [];
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href") ?? "";
      if (href === "" || href === "#" || href === "#!") {
        issues.push(`DEAD_HREF: ${(a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 30)}`);
        continue;
      }
      if (href.startsWith("#") && !document.getElementById(href.slice(1))) {
        issues.push(`MISSING_TARGET ${href} <- ${a.textContent.trim().slice(0, 30)}`);
      }
    }
    return { issues, anchorCount: document.querySelectorAll("a[href]").length };
  });
  check("anchors_resolve", audit.issues.length === 0, audit);

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")),
  );
  check("has_tel_link", hrefs.includes("tel:+916294667229"));
  const waLinks = hrefs.filter((h) => h && h.startsWith("https://wa.me/916294667229?text="));
  check("has_wa_links", waLinks.length >= 3, { count: waLinks.length });
  const maps = hrefs.find((h) => h && h.includes("google.com/maps/search"));
  check(
    "maps_uses_text_address",
    Boolean(maps) && maps.includes("Modan%20Mohanpara") && !/[-0-9]{2,}\.[0-9]{3,},/.test(maps),
    maps,
  );
  const waDecoded = waLinks.map((h) => decodeURIComponent(h.slice(WA_PREFIX.length)));
  check(
    "wa_generic_message",
    waDecoded.some((m) => m.startsWith("Hello Game Parlour,")),
    waDecoded[0]?.slice(0, 60),
  );
  await context.close();
}

/* 2. Header navigation scrolls to real sections --------------------------- */
{
  const { context, page } = await newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const navResults = {};
  for (const [label, hash] of [
    ["Home", "#hero"],
    ["Games", "#games"],
    ["Booking", "#booking"],
    ["About", "#about"],
    ["Contact", "#contact"],
  ]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: label, exact: true }).click();
    await page.waitForTimeout(800);
    navResults[label] = await page.evaluate((id) => {
      const el = document.getElementById(id.slice(1));
      return { hash: window.location.hash, exists: Boolean(el), top: el ? Math.round(el.getBoundingClientRect().top) : null };
    }, hash);
  }
  check(
    "nav_scrolls_to_sections",
    Object.values(navResults).every((r) => r.exists && r.hash),
    navResults,
  );
  await context.close();
}

/* 3. Mobile menu: open, item-click-closes, Escape, backdrop -------------- */
{
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(450);
  const opened = await page.evaluate(() => ({
    expanded: document.querySelector('[aria-controls="mobile-menu"]')?.getAttribute("aria-expanded"),
    drawerVisible:
      getComputedStyle(document.querySelector("#mobile-menu .gp-drawer")).visibility === "visible",
    dialog: Boolean(document.querySelector('#mobile-menu [role="dialog"]')),
  }));
  check("mobile_menu_opens", opened.expanded === "true" && opened.drawerVisible && opened.dialog, opened);

  await page
    .getByRole("navigation", { name: "Mobile" })
    .getByRole("link", { name: "About", exact: true })
    .click();
  await page.waitForTimeout(700);
  const afterClick = await page.evaluate(() => ({
    expanded: document.querySelector('[aria-controls="mobile-menu"]')?.getAttribute("aria-expanded"),
    hash: window.location.hash,
    drawer: getComputedStyle(document.querySelector("#mobile-menu .gp-drawer")).visibility,
    overflow: document.body.style.overflow || "(unset)",
  }));
  check(
    "mobile_menu_item_click_closes",
    afterClick.expanded === "false" &&
      afterClick.hash === "#about" &&
      afterClick.drawer === "hidden" &&
      afterClick.overflow === "(unset)",
    afterClick,
  );

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(450);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const afterEscape = await page.evaluate(() => ({
    expanded: document.querySelector('[aria-controls="mobile-menu"]')?.getAttribute("aria-expanded"),
    overflow: document.body.style.overflow || "(unset)",
  }));
  check(
    "mobile_menu_escape_closes",
    afterEscape.expanded === "false" && afterEscape.overflow === "(unset)",
    afterEscape,
  );

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.waitForTimeout(450);
  await page.locator("#mobile-menu .gp-backdrop").click({ position: { x: 30, y: 300 } });
  await page.waitForTimeout(500);
  const afterBackdrop = await page.evaluate(() => ({
    expanded: document.querySelector('[aria-controls="mobile-menu"]')?.getAttribute("aria-expanded"),
    pointerEvents: getComputedStyle(document.querySelector("#mobile-menu")).pointerEvents,
  }));
  check(
    "mobile_menu_backdrop_closes",
    afterBackdrop.expanded === "false" && afterBackdrop.pointerEvents === "none",
    afterBackdrop,
  );
  await context.close();
}

/*__VF_REST__*/

/* 4a. Hero CTAs + modal open/close + card preselection ------------------ */
{
  const { context, page } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const catalogue = await page.evaluate(async () => {
    const r = await fetch("/api/catalogue");
    return r.ok ? await r.json() : null;
  });
  const tekken = catalogue?.games?.find((g) => g.name === "Tekken 8") ?? null;
  check("catalogue_has_db_games", Boolean(tekken), catalogue?.games?.map((g) => g.name));

  await page.getByRole("link", { name: "Explore Games", exact: true }).click();
  await page.waitForTimeout(700);
  check(
    "hero_secondary_scrolls_to_games",
    (await page.evaluate(() => window.location.hash)) === "#games",
  );

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Book Your Station" }).click();
  await page.waitForSelector('[role="dialog"][aria-modal="true"][aria-labelledby="booking-modal-title"]', { timeout: 6000 });
  await page.waitForSelector(".gp-choice", { timeout: 8000 });
  const opened = await page.evaluate(() => ({
    focusInside: document
      .querySelector('[role="dialog"][aria-labelledby="booking-modal-title"]')
      ?.contains(document.activeElement ?? null),
    overflow: document.body.style.overflow,
    modalTitle: document.getElementById("booking-modal-title")?.textContent,
  }));
  check("hero_primary_opens_modal", opened.focusInside && opened.overflow === "hidden", opened);

  const choiceCount = await page.locator(".gp-choice-list .gp-choice").count();
  check("modal_lists_db_games", choiceCount >= 1, { choiceCount });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const closed = await page.evaluate(() => ({
    dialog: Boolean(document.querySelector('[role="dialog"][aria-modal="true"][aria-labelledby="booking-modal-title"]')),
    focus: (document.activeElement?.textContent ?? "").trim().slice(0, 30),
    overflow: document.body.style.overflow || "(unset)",
  }));
  check(
    "modal_escape_closes_restores_focus",
    !closed.dialog && closed.focus.includes("Book Your Station") && closed.overflow !== "hidden",
    closed,
  );

  if (!tekken) throw new Error("Tekken 8 missing from catalogue");
  await page.evaluate(() => document.getElementById("games")?.scrollIntoView());
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: `Book a session for ${tekken.name}` }).click();
  await page.waitForSelector(".gp-choice", { timeout: 8000 });
  const preselected = await page.evaluate((name) => {
    const row = Array.from(document.querySelectorAll(".gp-choice-list .gp-choice")).find((r) =>
      (r.textContent ?? "").includes(name),
    );
    return row?.getAttribute("data-selected") ?? "(missing)";
  }, tekken.name);
  check("card_book_now_preselects_game", preselected === "true", { preselected });

  await context.close();
}

/* 4b. Wizard walk: station → date/time → validation → review ----------- */
{
  const { context, page } = await newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const catalogue = await page.evaluate(async () => {
    const r = await fetch("/api/catalogue");
    return r.ok ? await r.json() : null;
  });
  const tekkenName = catalogue?.games?.find((g) => g.name === "Tekken 8")?.name ?? "";

  await page.evaluate(() => document.getElementById("games")?.scrollIntoView());
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: `Book a session for ${tekkenName}` }).click();
  await page.waitForSelector(".gp-choice", { timeout: 8000 });

  await page.getByTestId("wizard-continue").click();
  await page.waitForTimeout(300);
  await page.locator(".gp-fieldset .gp-choice:not([data-disabled])").first().click();
  await page.waitForTimeout(200);
  await page.getByTestId("wizard-continue").click();
  await page.waitForTimeout(300);

  // Randomised future slot: the wizard now really creates a booking, so a
  // second run must not depend on the slot the first run reserved.
  const runSlot = await page.evaluate(() => {
    const dayOffset = 2 + Math.floor(Math.random() * 21);
    const hour = 10 + Math.floor(Math.random() * 8);
    const minute = Math.random() < 0.5 ? "00" : "30";
    return {
      date: new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(Date.now() + dayOffset * 86_400_000)),
      time: `${String(hour).padStart(2, "0")}:${minute}`,
    };
  });
  await page.fill("#booking-date", runSlot.date);
  await page.fill("#booking-time", runSlot.time);
  await page.getByTestId("wizard-continue").click();
  await page.waitForTimeout(300);

  await page.getByTestId("wizard-continue").click();
  await page.waitForTimeout(350);
  const validation = await page.evaluate(() => ({
    name: document.getElementById("booking-name-error")?.textContent ?? null,
    phone: document.getElementById("booking-phone-error")?.textContent ?? null,
  }));
  check("details_step_validation_errors", Boolean(validation.name && validation.phone), validation);

  await page.fill("#booking-name", "Play Test");
  await page.fill("#booking-phone", "9876543210");
  const availabilityPromise = page.waitForResponse((r) => r.url().includes("/api/availability"), {
    // Generous: the first booking-flow request can still be compiling on a
    // cold dev server (the warm-up above normally makes this instant).
    timeout: 25000,
  });
  await page.getByTestId("wizard-continue").click();
  const availabilityResponse = await availabilityPromise;
  check("availability_fetched_for_review", availabilityResponse.status() === 200);

  await page.waitForSelector('[data-testid="booking-review"]', { timeout: 6000 });
  await page.waitForTimeout(400);
  const review = await page.evaluate(() => ({
    quoteText: document.querySelector('[data-testid="quote-block"]')?.textContent ?? "",
    waHref: document.querySelector('[data-testid="book-whatsapp"]')?.getAttribute("href") ?? "",
    reviewText: document.querySelector('[data-testid="booking-review"]')?.textContent ?? "",
  }));
  const quotedTotal = Number(
    (review.quoteText.match(/₹\s*([\d,]+)/)?.[1] ?? "").replace(/,/g, ""),
  );
  check(
    "review_total_comes_from_db_rules",
    review.quoteText.includes("Confirmed total") &&
      !review.quoteText.includes("hasn't been published") &&
      APPROVED_RATES.includes(quotedTotal),
    { quote: review.quoteText.slice(0, 140), quotedTotal },
  );

  const decodedWa = decodeURIComponent(review.waHref.replace(WA_PREFIX, ""));
  check(
    "review_whatsapp_dynamic_message",
    review.waHref.startsWith(WA_PREFIX) &&
      decodedWa.includes(`Game: ${tekkenName}`) &&
      decodedWa.includes("Station:") &&
      decodedWa.includes("Date:") &&
      decodedWa.includes("Time:") &&
      decodedWa.includes("Name: Play Test") &&
      decodedWa.includes("Please confirm availability and booking."),
    decodedWa.slice(0, 260),
  );
  check(
    "review_echoes_selections",
    review.reviewText.includes(tekkenName) && review.reviewText.includes("9876543210"),
  );

  await page.getByRole("button", { name: "Confirm booking" }).click();
  await page.waitForSelector('[data-testid="booking-success"], [data-testid="submit-error"]', {
    timeout: 25000,
  });
  await page.waitForTimeout(400);
  const confirmed = await page.evaluate(() => {
    const block = document.querySelector('[data-testid="booking-success"]');
    return {
      successShown: Boolean(block),
      code: document.querySelector('[data-testid="booking-code"]')?.textContent?.trim() ?? "",
      text: block?.textContent ?? "",
      error: document.querySelector('[data-testid="submit-error"]')?.textContent ?? "",
    };
  });
  const confirmedAmount = Number(
    (confirmed.text.match(/₹\s*([\d,]+)/)?.[1] ?? "").replace(/,/g, ""),
  );
  check(
    "confirm_creates_booking_at_db_price",
    confirmed.successShown &&
      /^GP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(confirmed.code) &&
      APPROVED_RATES.includes(confirmedAmount) &&
      confirmed.error === "",
    { code: confirmed.code, amount: confirmedAmount, error: confirmed.error.slice(0, 120) },
  );

  await context.close();
}

/* 5. API behaviour: catalogue, availability, booking validation --------- */
{
  const { context, page } = await newPage();
  const xf = { "X-Forwarded-For": `pw-api-${Date.now()}` };

  const cat = await page.request.get(`${BASE}/api/catalogue`);
  const catJson = cat.ok() ? await cat.json() : {};
  check("api_catalogue_db_driven", cat.ok() && catJson.games?.length >= 1 && catJson.stations?.length >= 1 && catJson.durations?.length >= 1, {
    games: catJson.games?.map((g) => g.name),
    stations: catJson.stations?.length,
    durations: catJson.durations,
  });

  const tomorrow = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 86_400_000));

  const av = await page.request.get(
    `${BASE}/api/availability?date=${tomorrow}&time=10:30&durationMin=60`,
    { headers: xf },
  );
  const avJson = av.ok() ? await av.json() : {};
  check(
    "api_availability_real_free_busy",
    av.ok() &&
      avJson.ok === true &&
      avJson.stations?.length >= 1 &&
      typeof avJson.stations[0].free === "boolean" &&
      avJson.pricingConfigured === true,
    {
      stations: avJson.stations?.map((s) => ({ n: s.name, free: s.free })),
      pricingConfigured: avJson.pricingConfigured,
    },
  );

  const game = catJson.games?.[0];
  const station = catJson.stations?.find((s) => s.status === "AVAILABLE") ?? catJson.stations?.[0];
  // Randomised slot: this POST really creates a booking now, so a re-run must
  // not collide with rows an earlier run left behind.
  const postSlot = {
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(Date.now() + (2 + Math.floor(Math.random() * 21)) * 86_400_000)),
    time: `${String(10 + Math.floor(Math.random() * 8)).padStart(2, "0")}:${
      Math.random() < 0.5 ? "00" : "30"
    }`,
  };
  const payload = {
    gameId: game?.id,
    stationId: station?.id,
    date: postSlot.date,
    time: postSlot.time,
    durationMin: 60,
    name: "Play Test",
    phone: "9876543210",
    consentNotifications: false,
  };

  const invalid = await page.request.post(`${BASE}/api/bookings`, {
    headers: xf,
    data: { ...payload, name: "", phone: "12" },
  });
  const invalidJson = await invalid.json().catch(() => ({}));
  check("api_post_invalid_rejected", invalid.status() === 400 && invalidJson.code === "VALIDATION", {
    status: invalid.status(),
    code: invalidJson.code,
  });

  const badDuration = await page.request.post(`${BASE}/api/bookings`, {
    headers: xf,
    data: { ...payload, durationMin: 999 },
  });
  check("api_post_unknown_duration_rejected", badDuration.status() === 400, {
    status: badDuration.status(),
  });

  const unknownStation = await page.request.post(`${BASE}/api/bookings`, {
    headers: xf,
    data: { ...payload, stationId: "does-not-exist" },
  });
  const unknownJson = await unknownStation.json().catch(() => ({}));
  check(
    "api_post_unknown_station_rejected",
    unknownStation.status() === 404 && unknownJson.code === "STATION_NOT_FOUND",
    { status: unknownStation.status(), code: unknownJson.code },
  );

  const valid = await page.request.post(`${BASE}/api/bookings`, { headers: xf, data: payload });
  const validJson = await valid.json().catch(() => ({}));
  check(
    "api_post_creates_booking_at_db_price",
    valid.status() === 201 &&
      validJson.ok === true &&
      typeof validJson.booking?.bookingCode === "string" &&
      validJson.booking?.total === 140 &&
      validJson.booking?.currency === "INR" &&
      validJson.booking?.status === "PENDING_PAYMENT",
    {
      status: valid.status(),
      code: validJson.booking?.bookingCode,
      total: validJson.booking?.total,
      bookingStatus: validJson.booking?.status,
    },
  );

  // Server-side double-booking guard (ARCHITECTURE.md §6): the same slot on the
  // same station must be refused once it is reserved.
  const clash = await page.request.post(`${BASE}/api/bookings`, { headers: xf, data: payload });
  const clashJson = await clash.json().catch(() => ({}));
  check(
    "api_post_double_booking_refused",
    clash.status() === 409 && clashJson.code === "STATION_UNAVAILABLE",
    { status: clash.status(), code: clashJson.code },
  );

  const originBlocked = await page.request.post(`${BASE}/api/bookings`, {
    headers: { ...xf, Origin: "https://evil.example" },
    data: payload,
  });
  check("api_post_foreign_origin_blocked", originBlocked.status() === 403, {
    status: originBlocked.status(),
  });

  await context.close();
}

/* 6. Contact + footer: real links, address rendered, no fake socials ----- */
{
  const { context, page } = await newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const contact = await page.evaluate(() => ({
    wa: document.querySelector('[data-testid="contact-whatsapp"]')?.getAttribute("href") ?? "",
    phone: document.querySelector('[data-testid="contact-phone"]')?.getAttribute("href") ?? "",
    directions: document.querySelector('[data-testid="contact-directions"]')?.getAttribute("href") ?? "",
    addressLines: Array.from(document.querySelectorAll("address span.block")).map((s) => s.textContent.trim()),
    footerTel: Array.from(document.querySelectorAll("footer a")).some((a) => a.getAttribute("href") === "tel:+916294667229"),
    footerWa: Array.from(document.querySelectorAll("footer a")).some((a) => (a.getAttribute("href") ?? "").startsWith("https://wa.me/916294667229")),
    footerMaps: Array.from(document.querySelectorAll("footer a")).some((a) => (a.getAttribute("href") ?? "").includes("google.com/maps")),
    fakeSocials: Array.from(document.querySelectorAll("footer a[href]")).filter((a) =>
      /facebook|instagram|twitter|x\.com|youtube|tiktok/i.test(a.getAttribute("href") ?? ""),
    ).length,
  }));
  check("contact_whatsapp_link", contact.wa.startsWith(WA_PREFIX));
  check("contact_phone_link", contact.phone === "tel:+916294667229");
  check(
    "contact_directions_text_address",
    contact.directions.includes("google.com/maps/search") && contact.directions.includes("Dinhata"),
    contact.directions,
  );
  check(
    "contact_address_rendered",
    contact.addressLines.some((l) => l.includes("Ward No. 3")) &&
      contact.addressLines.some((l) => l.includes("Dinhata")) &&
      contact.addressLines.some((l) => l.includes("West Bengal")),
    contact.addressLines,
  );
  check(
    "footer_has_whatsapp_call_directions",
    contact.footerTel && contact.footerWa && contact.footerMaps,
    contact,
  );
  check("footer_no_fake_socials", contact.fakeSocials === 0, { fakeSocials: contact.fakeSocials });
  await context.close();
}

/* 7. Floating WhatsApp: accessible, 44px+, in-viewport, never blocks UI -- */
{
  const { context, page } = await newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const float = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="whatsapp-float"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const toggle = document.querySelector('[aria-controls="mobile-menu"]');
    const tr = toggle?.getBoundingClientRect();
    const overlap = tr
      ? !(r.right < tr.left || r.left > tr.right || r.bottom < tr.top || r.top > tr.bottom)
      : false;
    return {
      label: el.getAttribute("aria-label"),
      href: el.getAttribute("href") ?? "",
      inViewport:
        r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight,
      overlapsToggle: overlap,
      size: { w: Math.round(r.width), h: Math.round(r.height) },
    };
  });
  check(
    "float_accessible_44px",
    Boolean(float?.label) && float.href.startsWith(WA_PREFIX) && float.size.w >= 44 && float.size.h >= 44,
    float,
  );
  check(
    "float_in_viewport_no_hamburger_overlap",
    Boolean(float) && float.inViewport && !float.overlapsToggle,
    float,
  );

  await page.getByRole("button", { name: "Book Your Station" }).click();
  await page.waitForSelector('[role="dialog"][aria-modal="true"][aria-labelledby="booking-modal-title"]', { timeout: 6000 });
  const layered = await page.evaluate(() => {
    const layer = document.querySelector(".gp-modal-layer");
    const floatEl = document.querySelector('[data-testid="whatsapp-float"]');
    if (!layer || !floatEl) return null;
    const r = floatEl.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      layerZ: getComputedStyle(layer).zIndex,
      floatZ: getComputedStyle(floatEl).zIndex,
      blockedByLayer: Boolean(top) && layer.contains(top),
    };
  });
  check(
    "modal_layer_covers_float",
    Boolean(layered) && Number(layered.layerZ) > Number(layered.floatZ) && layered.blockedByLayer,
    layered,
  );
  await context.close();
}

/* 8. Game cards: cover art + price hint, both database-driven ----------- */
{
  const { context, page } = await newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const cards = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll("[data-game-card]"));
    const imgs = nodes.flatMap((c) => Array.from(c.querySelectorAll("img")));
    const hints = nodes.map((c) => c.querySelector("[data-price-hint]"));
    return {
      cards: nodes.length,
      names: nodes.map((c) => c.querySelector("h3")?.textContent?.trim()),
      imgCount: imgs.length,
      brokenCount: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
      altsOk: imgs.every((i) => Boolean(i.alt) && i.alt.startsWith("Cover art for")),
      fallbacks: nodes.filter((c) => c.querySelector(".gp-media-fallback")).length,
      priceHints: hints.map((el) => el?.getAttribute("data-price-hint") ?? ""),
      priceText: hints.map((el) => (el?.textContent ?? "").replace(/\s+/g, " ").trim()),
      monoFamilies: hints.map((el) => {
        const number = el?.querySelector(".font-mono");
        return number ? getComputedStyle(number).fontFamily : "";
      }),
    };
  });
  check("cards_rendered_from_db", cards.cards >= 1 && (cards.names ?? []).includes("Tekken 8"), cards);
  check("no_broken_image_elements", cards.brokenCount === 0, cards);
  check("every_card_has_a_visual", cards.imgCount + cards.fallbacks === cards.cards, {
    cards: cards.cards,
    imgs: cards.imgCount,
    fallbacks: cards.fallbacks,
  });
  check("image_alts_meaningful", cards.altsOk, cards);

  const hints = cards.priceHints.map((hint) => hint.split(":").map(Number));
  check(
    "card_price_hints_match_approved_card",
    hints.length >= 1 &&
      hints.every(([amount, duration]) => APPROVED_RATES.includes(amount) && duration > 0),
    cards.priceHints,
  );
  check(
    "card_price_hint_reflects_global_rate_card",
    hints.some(([amount, duration]) => amount === 75 && duration === 30) &&
      hints.every(([amount]) => amount >= 75),
    cards.priceHints,
  );
  check(
    "card_price_labels_and_mono_numbers",
    cards.priceText.every((text) => /^From\s*₹[\d,]+\s*\/\s*(30 min|1 hour|2 hours)$/.test(text)) &&
      cards.monoFamilies.every((family) => /jetbrains/i.test(family)),
    { priceText: cards.priceText, monoFamilies: cards.monoFamilies },
  );

  await context.close();
}

/* 9. Responsive: 6 widths, no overflow, 44px targets, float ok ---------- */
{
  report.responsive = {};
  for (const width of [320, 375, 768, 1024, 1280, 1440]) {
    const { context, page } = await newPage({ viewport: { width, height: 900 } });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(400, 0));
    await page.waitForTimeout(250);
    report.responsive[width] = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      smallTargets: Array.from(document.querySelectorAll("a.gp-btn, button.gp-btn"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.height > 0 && r.height < 44;
        })
        .map((el) => el.textContent.trim().slice(0, 24)),
      gameCards: document.querySelectorAll("[data-game-card]").length,
      floatInViewport: (() => {
        const el = document.querySelector('[data-testid="whatsapp-float"]');
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.left >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight;
      })(),
    }));
    await context.close();
  }
  check(
    "no_horizontal_overflow_6_widths",
    Object.values(report.responsive).every((d) => d.overflow <= 0),
    Object.fromEntries(Object.entries(report.responsive).map(([k, v]) => [k, v.overflow])),
  );
  check(
    "touch_targets_min_44_6_widths",
    Object.values(report.responsive).every((d) => d.smallTargets.length === 0),
    JSON.stringify(Object.fromEntries(Object.entries(report.responsive).map(([k, v]) => [k, v.smallTargets]))),
  );
  check(
    "game_cards_at_every_width",
    Object.values(report.responsive).every((d) => d.gameCards >= 1),
    Object.fromEntries(Object.entries(report.responsive).map(([k, v]) => [k, v.gameCards])),
  );
  check(
    "float_within_viewport_6_widths",
    Object.values(report.responsive).every((d) => d.floatInViewport),
  );
}

/* 10. Reduced motion + keyboard + console gate --------------------------- */
{
  const { context, page } = await newPage({ reducedMotion: "reduce" });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(600);
  const rm = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    layerTransforms: Array.from(document.querySelectorAll(".gp-hero-layer")).map(
      (l) => getComputedStyle(l).transform,
    ),
    particleCount: document.querySelectorAll(".gp-particle").length,
    particleAnimation: (() => {
      const p = document.querySelector(".gp-particle");
      return p ? getComputedStyle(p).animationName : "(missing)";
    })(),
    revealOpacity: (() => {
      const r = document.querySelector(".gp-reveal");
      return r ? getComputedStyle(r).opacity : "(missing)";
    })(),
  }));
  check("reduced_motion_scroll_auto", rm.scrollBehavior === "auto", rm);
  check(
    "reduced_motion_particles_present_but_disabled",
    rm.particleCount > 0 && rm.particleAnimation === "none",
    rm,
  );
  check(
    "reduced_motion_no_parallax_transform",
    rm.layerTransforms.every((t) => t === "none"),
    rm.layerTransforms,
  );
  check("reduced_motion_content_visible", rm.revealOpacity === "1" || rm.revealOpacity === "(missing)", rm);
  await context.close();
}

{
  const { context, page } = await newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => (document.activeElement?.textContent ?? "").trim());
  check("keyboard_first_stop_is_skip_link", first.includes("Skip to main content"), first);
  await context.close();
}

check(
  "no_console_errors",
  report.consoleErrors.length === 0,
  report.consoleErrors.slice(0, 8),
);

await browser.close();
console.log(JSON.stringify(report, null, 2));
if (report.failed.length > 0 || report.consoleErrors.length > 0) process.exitCode = 1;
