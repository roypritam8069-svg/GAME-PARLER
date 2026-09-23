import { prisma } from "@/lib/db/prisma";

/**
 * Public game DTO.
 *
 * This is the minimum data GameCard needs (DESIGN.md §24: title, platform,
 * description/meta). It mirrors the `Game` model in prisma/schema.prisma and
 * keeps Prisma types out of presentational components.
 *
 * Note: `imageUrl` and `description` are nullable in the schema, so the UI must
 * render correctly without them. `price` is the cheapest active rule (or null
 * when the Owner has published none) — it is a display hint only; the real,
 * authoritative quote is computed server-side at booking time.
 */
export type PublicGamePrice = {
  amount: number;
  durationMin: number;
};

export type PublicGame = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  platform: string;
  imageUrl: string | null;
  price: PublicGamePrice | null;
};

/**
 * Cheapest publishable price for a card hint.
 *
 * Standard (off-peak) rates are preferred, because that is what a normal
 * session pays; a peak-only catalogue still yields a hint instead of a blank
 * card. Returns `null` when no usable rule exists — inventing a number is
 * forbidden (DESIGN.md §68).
 */
function pickPriceHint(
  rules: Array<{ price: unknown; durationMin: number; isPeak: boolean }>,
): PublicGamePrice | null {
  let standard: PublicGamePrice | null = null;
  let cheapest: PublicGamePrice | null = null;

  for (const rule of rules) {
    const amount = Number(rule.price);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const candidate = { amount, durationMin: rule.durationMin };

    if (cheapest === null || amount < cheapest.amount) cheapest = candidate;
    if (!rule.isPeak && (standard === null || amount < standard.amount)) {
      standard = candidate;
    }
  }

  return standard ?? cheapest;
}

/**
 * Returns every ACTIVE game for public pages.
 *
 * ARCHITECTURE.md §4 — the Services layer sits between the app and PostgreSQL,
 * so no page queries the database directly and no page owns price logic.
 * RULES.md §2        — no hard-coded game names/descriptions/platforms/IDs.
 *
 * Pricing mirrors the booking engine's matching rule: a rule applies to a game
 * when it is attached to that game OR published globally (`gameId: null`).
 * Without the global half, cards would show no price at all for the Owner's
 * general rate card, which carries no `gameId` (services/pricing.service.ts).
 *
 * Server-only: this module must never be imported by a Client Component.
 */
export async function listActiveGames(): Promise<PublicGame[]> {
  const [games, globalRules] = await Promise.all([
    prisma.game.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        platform: true,
        imageUrl: true,
        pricingRules: {
          where: { isActive: true },
          select: { price: true, durationMin: true, isPeak: true },
        },
      },
    }),

    // Owner-wide rate card (no game attached) — applies to every game.
    prisma.pricingRule.findMany({
      where: { isActive: true, gameId: null },
      select: { price: true, durationMin: true, isPeak: true },
    }),
  ]);

  return games.map((game) => ({
    id: game.id,
    name: game.name,
    slug: game.slug,
    description: game.description,
    platform: game.platform,
    imageUrl: game.imageUrl,
    price: pickPriceHint([...game.pricingRules, ...globalRules]),
  }));
}