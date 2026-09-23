// TEMPORARY browser proof for the game-card cover art — deleted after use.
import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

const OUT = path.join(process.cwd(), ".tmp-proof");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const consoleErrors = [];
const badResponses = [];

async function shoot(width, height, label) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`${label}: ${msg.text()}`);
  });
  page.on("requestfailed", (req) =>
    badResponses.push(`${label}: FAILED ${req.url()} (${req.failure()?.errorText})`),
  );
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push(`${label}: HTTP ${res.status()} ${res.url()}`);
  });

  await page.goto("http://localhost:3000/#games", { waitUntil: "load" });
  await page.waitForSelector("[data-game-card] img", { timeout: 30_000 });
  await page.waitForFunction(
    () => {
      const imgs = Array.from(document.querySelectorAll("[data-game-card] img"));
      return imgs.length === 3 && imgs.every((img) => img.complete && img.naturalWidth > 0);
    },
    null,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(500);

  const data = await page.$$eval("[data-game-card]", (cards) =>
    cards.map((card) => {
      const img = card.querySelector("img");
      const media = card.querySelector(".gp-card-media");
      const box = media?.getBoundingClientRect();
      const rendered = img?.getBoundingClientRect();

      return {
        name: card.querySelector("h3")?.textContent?.trim() ?? null,
        currentSrc: img?.currentSrc ?? null,
        alt: img?.getAttribute("alt") ?? null,
        natural: img ? `${img.naturalWidth}x${img.naturalHeight}` : null,
        decoded: img ? img.complete && img.naturalWidth > 0 : false,
        objectFit: img ? getComputedStyle(img).objectFit : null,
        cssPosition: img ? getComputedStyle(img).position : null,
        rendered: rendered ? `${Math.round(rendered.width)}x${Math.round(rendered.height)}` : null,
        mediaBox: box ? `${Math.round(box.width)}x${Math.round(box.height)}` : null,
        mediaRadius: media ? getComputedStyle(media).borderTopLeftRadius : null,
        fallbackShown: Boolean(card.querySelector(".gp-media-fallback")),
        cardText: card.innerText.replace(/\s+/g, " ").slice(0, 90),
      };
    }),
  );

  await page.locator("#games ul").first().screenshot({ path: path.join(OUT, `games-${label}.png`) });
  await ctx.close();

  return data;
}

const results = {
  w1280: await shoot(1280, 900, "1280"),
  w768: await shoot(768, 900, "768"),
  w320: await shoot(320, 800, "320"),
};

await browser.close();
console.log(JSON.stringify({ results, consoleErrors, badResponses }, null, 2));
