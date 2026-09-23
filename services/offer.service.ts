import { prisma } from "@/lib/db/prisma";

export type PublicOffer = {
  id: string;
  name: string;
  description: string | null;
  endsAt: Date;
};

/**
 * Returns only offers that are active AND currently inside their validity
 * window, so an expired promotion can never be shown as available.
 * Server-only (ARCHITECTURE.md §4).
 */
export async function listActiveOffers(take = 3): Promise<PublicOffer[]> {
  const now = new Date();

  return prisma.offer.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { endsAt: "asc" },
    take,
    select: {
      id: true,
      name: true,
      description: true,
      endsAt: true,
    },
  });
}