// TEMPORARY clean screenshot pass (sticky header hidden) — deleted after use.
import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

const OUT = path.join(process.cwd(), ".tmp-proof");
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const summary = [];

for (const [width, height, label] of [
  [1280, 900, "1280"],
  [320, 800, "320"],
]) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();

  await page.goto("http://localhost:3000/#games", { waitUntil: "load" });
  await page.waitForFunction(
    () => {
      const imgs = Array.from(document.querySelectorAll("[data-game-card] img"));
      return imgs.length === 3 && imgs.every((i) => i.complete && i.naturalWidth > 0);
    },
    null,
    { timeout: 60_000 },
  );

  // Hide sticky/fixed chrome so nothing paints over the cards in the capture.
  await page.addStyleTag({
    content: "header, [class*='gp-chat'], [aria-label*='WhatsApp'] { display: none !important; }",
  });
  await page.waitForTimeout(400);

  await page.locator("#games").screenshot({ path: path.join(OUT, `clean-${label}.png`) });

  summary.push({
    label,
    imgCount: await page.locator("[data-game-card] img").count(),
    fallbackCount: await page.locator("[data-game-card] .gp-media-fallback").count(),
  });

  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(summary));
