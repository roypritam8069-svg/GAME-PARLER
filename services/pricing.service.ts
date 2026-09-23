import { prisma } from "@/lib/db/prisma";

/**
 * Pricing service (ARCHITECTURE.md §4/§8).
 *
 * Prices come ONLY from active `PricingRule` rows. When the Owner has not
 * published any rules yet, durations still fall back to the documented
 * 30/60/120 session lengths (MEMORY.md / PRD.md §3 — approved business
 * decision) while `quotePrice` honestly returns null so no price is ever
 * invented (DESIGN.md §68, ADR-007).
 *
 * Server-only: never import from a Client Component.
 */

export const APPROVED_DURATIONS_MIN = [30, 60, 120] as const;

export type PriceQuoteRule = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
};

export type PriceQuote = {
  currency: string;
  subtotal: number;
  discount: number;
  total: number;
  rules: PriceQuoteRule[];
  quotedAt: string;
};

/** Session lengths the booking flow offers (DB-derived when possible). */
export async function listBookingDurations(): Promise<number[]> {
  const rules = await prisma.pricingRule.findMany({
    where: { isActive: true },
    select: { durationMin: true },
    distinct: ["durationMin"],
    orderBy: { durationMin: "asc" },
  });

  const durations = rules
    .map((rule) => rule.durationMin)
    .filter((minutes) => Number.isInteger(minutes) && minutes > 0 && minutes <= 24 * 60);

  return durations.length > 0 ? durations : [...APPROVED_DURATIONS_MIN];
}

type QuoteParams = {
  gameId: string;
  stationId: string;
  durationMin: number;
  /** Slot start — rules with an effective window are checked against it. */
  at: Date;
};

/**
 * Server-side quote for one session. Returns `null` when no active rule
 * matches — callers must treat that as "pricing not configured", never as
 * a zero-price booking.
 */
/**
 * True when the Owner has published at least one active pricing rule.
 * Drives the honest "pricing not configured" state in the UI (ADR-007).
 */
export async function hasActivePricingRules(): Promise<boolean> {
  const count = await prisma.pricingRule.count({ where: { isActive: true } });
  return count > 0;
}

export async function quotePrice(params: QuoteParams): Promise<PriceQuote | null> {
  const rules = await prisma.pricingRule.findMany({
    where: {
      isActive: true,
      durationMin: params.durationMin,
      OR: [{ gameId: null }, { gameId: params.gameId }],
      AND: [
        { OR: [{ stationId: null }, { stationId: params.stationId }] },
        { OR: [{ startsAt: null }, { startsAt: { lte: params.at } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: params.at } }] },
      ],
    },
    select: { id: true, name: true, durationMin: true, price: true },
  });

  // Cheapest matching rule wins so the quoted price is the real charge;
  // peak rules participate naturally (a cheaper non-peak rule always wins).
  let best: { id: string; name: string; durationMin: number; price: number } | null = null;
  for (const rule of rules) {
    const amount = Number(rule.price);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (best === null || amount < best.price) {
      best = { id: rule.id, name: rule.name, durationMin: rule.durationMin, price: amount };
    }
  }

  if (!best) return null;

  return {
    currency: "INR",
    subtotal: best.price,
    discount: 0,
    total: best.price,
    rules: [best],
    quotedAt: new Date().toISOString(),
  };
}