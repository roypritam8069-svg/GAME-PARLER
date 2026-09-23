import fs from "node:fs";
import path from "node:path";

import { PrismaClient, StationStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Optional cover art per game slug (files live in `public/games` — see
 * `public/games/README.md`). The first file that exists on disk wins.
 *
 * `Game.imageUrl` is only written when the asset is really there, so a missing
 * file renders the card's built-in fallback panel instead of firing a 404 for
 * every page view. Drop the image in and re-run `npm run prisma:seed`.
 */
const GAME_IMAGE_CANDIDATES: Record<string, string[]> = {
  "ea-sports-fc-25": ["ea-fc-25.webp", "ea-fc-25.jpg"],
  "grand-theft-auto-v": ["gta-v.webp", "gta-v.jpg"],
  "tekken-8": ["tekken-8.webp", "tekken-8.jpg"],
};

/** Returns the public path of the first existing cover file, else `null`. */
function resolveImageUrl(slug: string): string | null {
  for (const file of GAME_IMAGE_CANDIDATES[slug] ?? []) {
    if (fs.existsSync(path.join(process.cwd(), "public", "games", file))) {
      return `/games/${file}`;
    }
  }

  return null;
}

type SeedPricingRule = {
  name: string;
  durationMin: number;
  price: number;
  isPeak: boolean;
};

/**
 * Owner-approved rate card. Rules carry no `gameId`/`stationId`, so they apply
 * to every game and every station — the same matching a booking quote uses
 * (services/pricing.service.ts: `quotePrice`).
 *
 * `durationMin` values must stay aligned with the session lengths the booking
 * flow offers (30 / 60 / 120 minutes).
 */
const PRICING_RULES: SeedPricingRule[] = [
  { name: "30 Minutes - Standard", durationMin: 30, price: 75, isPeak: false },
  { name: "1 Hour - Standard", durationMin: 60, price: 140, isPeak: false },
  { name: "2 Hours - Standard", durationMin: 120, price: 260, isPeak: false },
  { name: "30 Minutes - Peak", durationMin: 30, price: 100, isPeak: true },
  { name: "1 Hour - Peak", durationMin: 60, price: 180, isPeak: true },
  { name: "2 Hours - Peak", durationMin: 120, price: 320, isPeak: true },
];

async function main(): Promise<void> {
  console.log("Seeding Game Parlour database...");

  const games = [
    {
      name: "EA Sports FC 25",
      slug: "ea-sports-fc-25",
      platform: "PlayStation 5",
      description: "Football gaming experience.",
    },
    {
      name: "Grand Theft Auto V",
      slug: "grand-theft-auto-v",
      platform: "PlayStation 5",
      description: "Open-world action experience.",
    },
    {
      name: "Tekken 8",
      slug: "tekken-8",
      platform: "PlayStation 5",
      description: "Competitive fighting game.",
    },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: {
        slug: game.slug,
      },
      update: {
        name: game.name,
        platform: game.platform,
        description: game.description,
        imageUrl: resolveImageUrl(game.slug),
        isActive: true,
      },
      create: { ...game, imageUrl: resolveImageUrl(game.slug) },
    });
  }

  const stations = [
    {
      name: "PS5 Station 01",
      consoleType: "PlayStation 5",
    },
    {
      name: "PS5 Station 02",
      consoleType: "PlayStation 5",
    },
    {
      name: "PS5 Station 03",
      consoleType: "PlayStation 5",
    },
    {
      name: "PS5 Station 04",
      consoleType: "PlayStation 5",
    },
  ];

  for (const station of stations) {
    await prisma.station.upsert({
      where: {
        name: station.name,
      },
      update: {
        consoleType: station.consoleType,
        status: StationStatus.AVAILABLE,
        isActive: true,
      },
      create: station,
    });
  }

  // Global rules (no game/station) apply to every game and every station,
  // which is exactly how a quote is resolved during booking. Re-running the
  // seed replaces the published rate card so the table matches this list.
  await prisma.pricingRule.deleteMany({});
  await prisma.pricingRule.createMany({ data: PRICING_RULES });

  console.log(`Pricing rules added: ${PRICING_RULES.length}.`);

  const gamesWithoutArt = games.filter((game) => resolveImageUrl(game.slug) === null);
  if (gamesWithoutArt.length > 0) {
    console.log(
      `Cover art not found for: ${gamesWithoutArt.map((game) => game.slug).join(", ")}` +
        " (place the files in public/games - see public/games/README.md).",
    );
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });