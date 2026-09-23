import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

/**
 * Availability service (ARCHITECTURE.md §4/§6, USER_FLOWS.md §7).
 *
 * A slot is busy when it overlaps:
 *   1. a `PENDING_PAYMENT` or `CONFIRMED` booking on that station (holds
 *      and confirmed bookings both reserve the station), or
 *   2. an `AvailabilityBlock(type: STATION)` for that station, or
 *   3. an `AvailabilityBlock(type: PARLOUR)` (applies to every station).
 *
 * `DRAFT`/expired bookings do not reserve a slot. Client-side availability
 * is informational only — the booking route re-runs these queries inside
 * the transaction (SECURITY.md: server-side availability).
 *
 * Server-only: never import from a Client Component.
 */

type Db = Prisma.TransactionClient | typeof prisma;

export const RESERVING_BOOKING_STATUSES = ["PENDING_PAYMENT", "CONFIRMED"] as const;

export type SlotConflict = {
  kind: "booking" | "station-block" | "parlour-block";
  startsAt: Date;
  endsAt: Date;
};

/**
 * Count everything that would block `stationId` during [startsAt, endsAt).
 * Sequential awaits on purpose: safe for both the global client and a
 * transaction client.
 */
export async function findSlotConflicts(
  db: Db,
  stationId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<SlotConflict[]> {
  const conflicts: SlotConflict[] = [];

  const bookings = await db.booking.findMany({
    where: {
      stationId,
      status: { in: [...RESERVING_BOOKING_STATUSES] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { startsAt: true, endsAt: true },
    take: 5,
  });
  for (const booking of bookings) {
    conflicts.push({ kind: "booking", startsAt: booking.startsAt, endsAt: booking.endsAt });
  }

  const stationBlocks = await db.availabilityBlock.findMany({
    where: {
      type: "STATION",
      stationId,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { startsAt: true, endsAt: true },
    take: 5,
  });
  for (const block of stationBlocks) {
    conflicts.push({ kind: "station-block", startsAt: block.startsAt, endsAt: block.endsAt });
  }

  const parlourBlocks = await db.availabilityBlock.findMany({
    where: { type: "PARLOUR", startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    select: { startsAt: true, endsAt: true },
    take: 5,
  });
  for (const block of parlourBlocks) {
    conflicts.push({ kind: "parlour-block", startsAt: block.startsAt, endsAt: block.endsAt });
  }

  return conflicts;
}

export type StationSlotStatus = {
  id: string;
  name: string;
  consoleType: string;
  status: "AVAILABLE" | "DISABLED" | "MAINTENANCE";
  free: boolean;
  conflictCount: number;
};

/**
 * Free/busy status for every active station inside one proposed window.
 * Feeds the booking wizard's station list and time checks (DESIGN.md §26/§27
 * states must reflect real data, not guesses).
 */
export async function getStationsSlotStatus(
  startsAt: Date,
  endsAt: Date,
): Promise<StationSlotStatus[]> {
  const stations = await prisma.station.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, consoleType: true, status: true },
  });

  const results = await Promise.all(
    stations.map(async (station) => {
      const bookable = station.status === "AVAILABLE";
      const conflicts =
        bookable
          ? await findSlotConflicts(prisma, station.id, startsAt, endsAt)
          : [];
      return {
        id: station.id,
        name: station.name,
        consoleType: station.consoleType,
        status: station.status,
        free: bookable && conflicts.length === 0,
        conflictCount: conflicts.length,
      };
    }),
  );
  return results;
}