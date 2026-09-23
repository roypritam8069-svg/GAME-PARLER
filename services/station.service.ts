import type { StationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

/**
 * Station status re-exported as a type only, so pages never import the Prisma
 * runtime for presentation logic (ARCHITECTURE.md §4).
 */
export type PublicStationStatus = StationStatus;

export type PublicStation = {
  id: string;
  name: string;
  consoleType: string;
  status: PublicStationStatus;
  /**
   * Cheapest active 60-minute rule, or null. Only a full-hour rule can honestly
   * be presented as an hourly rate; anything else would be a fabricated figure.
   */
  hourlyFrom: number | null;
};

/**
 * Returns every ACTIVE station with a truthful hourly reference price.
 * Server-only (ARCHITECTURE.md §4).
 */
export async function listActiveStations(): Promise<PublicStation[]> {
  const stations = await prisma.station.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      consoleType: true,
      status: true,
      pricingRules: {
        where: { isActive: true },
        select: { price: true, durationMin: true },
      },
    },
  });

  return stations.map((station) => {
    const hourly = station.pricingRules
      .filter((rule) => rule.durationMin === 60)
      .map((rule) => Number(rule.price))
      .filter((amount) => Number.isFinite(amount) && amount > 0);

    return {
      id: station.id,
      name: station.name,
      consoleType: station.consoleType,
      status: station.status,
      hourlyFrom: hourly.length > 0 ? Math.min(...hourly) : null,
    };
  });
}