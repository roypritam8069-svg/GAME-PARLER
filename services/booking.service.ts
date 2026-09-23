import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

import { prisma } from "@/lib/db/prisma";
import { findSlotConflicts } from "@/services/availability.service";
import { quotePrice } from "@/services/pricing.service";
import { VENUE_TIMEZONE_OFFSET, type BookingRequest } from "@/lib/booking-schema";

/**
 * Booking service (ARCHITECTURE.md §5, USER_FLOWS.md §3/§4/§8,
 * SECURITY.md "Booking Security", RULES.md §4).
 *
 * Server is authoritative. Order of operations (ADR-007):
 *   validate → lock station row → re-check station/game → re-check
 *   availability → quote price from PricingRule rows → ONLY THEN write
 *   Customer/Consent/Booking/Payment/AuditLog inside one transaction.
 *
 * When no pricing rule matches, the flow fails BEFORE any write, so the
 * "pricing not configured" path never creates partial data.
 *
 * Server-only: never import from a Client Component.
 */

export type BookingErrorCode =
  | "INVALID_SLOT"
  | "GAME_NOT_FOUND"
  | "STATION_NOT_FOUND"
  | "STATION_UNAVAILABLE"
  | "PRICE_NOT_CONFIGURED"
  | "DUPLICATE_BOOKING";

export class BookingError extends Error {
  constructor(
    public readonly code: BookingErrorCode,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export type CreateBookingInput = BookingRequest;

export type CreatedBooking = {
  bookingCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  gameName: string;
  stationName: string;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
};

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function randomCodeFragment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[(bytes[i] ?? 0) % CODE_ALPHABET.length];
  }
  return out;
}

/**
 * Parse a venue-local `date` + `time` (UTC+5:30) into a Date. Rejects
 * calendar dates that do not exist (e.g. 2026-02-31) — the ISO parser
 * returns NaN for those, and the expected-UTC round-trip catches anything
 * else that would be silently normalised.
 */
export function parseSlot(date: string, time: string): Date {
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) {
    throw new BookingError("INVALID_SLOT", "Choose a valid date and start time.", 400);
  }

  const startsAt = new Date(`${date}T${time}:00${VENUE_TIMEZONE_OFFSET}`);
  if (Number.isNaN(startsAt.getTime())) {
    throw new BookingError("INVALID_SLOT", "Choose a valid date and start time.", 400);
  }

  const expectedUtc = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(time.slice(0, 2)) - 5,
    Number(time.slice(3, 5)) - 30,
  );
  if (Math.abs(startsAt.getTime() - expectedUtc) > 60_000) {
    throw new BookingError("INVALID_SLOT", "Choose a valid date and start time.", 400);
  }

  return startsAt;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2025")
  );
}

export async function createBooking(input: CreateBookingInput): Promise<CreatedBooking> {
  const startsAt = parseSlot(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + input.durationMin * 60_000);

  if (startsAt.getTime() < Date.now() - 5_000) {
    throw new BookingError(
      "INVALID_SLOT",
      "That start time has already passed. Pick a later slot.",
      400,
    );
  }

  return prisma.$transaction(
    async (tx) => {
      // 1. Serialize concurrent bookings for the SAME station: a conflicting
      //    request waits here, then sees the first booking when it re-checks
      //    availability below (USER_FLOWS.md §8, no schema change needed).
      await tx.$queryRaw`SELECT id FROM "Station" WHERE id = ${input.stationId} FOR UPDATE`;

      const station = await tx.station.findFirst({
        where: { id: input.stationId, isActive: true },
        select: { id: true, name: true, status: true },
      });
      if (!station) {
        throw new BookingError("STATION_NOT_FOUND", "That station does not exist.", 404);
      }
      if (station.status !== "AVAILABLE") {
        throw new BookingError(
          "STATION_UNAVAILABLE",
          "That station is not bookable right now. Please pick another one.",
          409,
        );
      }

      const game = await tx.game.findFirst({
        where: { id: input.gameId, isActive: true },
        select: { id: true, name: true },
      });
      if (!game) {
        throw new BookingError(
          "GAME_NOT_FOUND",
          "That game is no longer listed. Please pick another one.",
          404,
        );
      }

      // 2. Re-check availability — never trust the client (SECURITY.md).
      const conflicts = await findSlotConflicts(tx, station.id, startsAt, endsAt);
      if (conflicts.length > 0) {
        throw new BookingError(
          "STATION_UNAVAILABLE",
          "That station is already booked for this time. Please choose another time or station.",
          409,
        );
      }

      // 3. Server-side price — fails BEFORE any write when rules are absent.
      const quote = await quotePrice({
        gameId: game.id,
        stationId: station.id,
        durationMin: input.durationMin,
        at: startsAt,
      });
      if (!quote) {
        throw new BookingError(
          "PRICE_NOT_CONFIGURED",
          "Pricing for this session is not published yet. Please book via WhatsApp or at the counter.",
          422,
        );
      }

      // 4. Customer (upsert by unique phone — minimum PII, PRD.md §4).
      let customer;
      try {
        customer = await tx.customer.upsert({
          where: { phone: input.phone },
          update: input.email ? { name: input.name, email: input.email } : { name: input.name },
          create: { name: input.name, phone: input.phone, email: input.email },
          select: { id: true },
        });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        const existing = await tx.customer.findUnique({
          where: { phone: input.phone },
          select: { id: true },
        });
        if (!existing) throw error;
        customer = existing;
      }

      // 5. Transactional notification consent only — marketing consent stays
      //    separate and is never bundled (PRD.md §6, RULES.md §7).
      await tx.consent.upsert({
        where: { customerId_type: { customerId: customer.id, type: "BOOKING_NOTIFICATION" } },
        update: {
          granted: input.consentNotifications,
          grantedAt: input.consentNotifications ? new Date() : null,
          revokedAt: input.consentNotifications ? null : new Date(),
          source: "booking_form",
        },
        create: {
          customerId: customer.id,
          type: "BOOKING_NOTIFICATION",
          granted: input.consentNotifications,
          grantedAt: input.consentNotifications ? new Date() : null,
          source: "booking_form",
        },
      });

      // 6. Unique booking code + QR token (checked before create; inside the
      //    per-station lock concurrent same-station requests are serialized).
      let bookingCode = `GP-${randomCodeFragment(4)}-${randomCodeFragment(4)}`;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const clash = await tx.booking.findUnique({
          where: { bookingCode },
          select: { id: true },
        });
        if (!clash) break;
        bookingCode = `GP-${randomCodeFragment(4)}-${randomCodeFragment(4)}`;
      }
      const qrToken = randomBytes(16).toString("hex");

      const booking = await tx.booking.create({
        data: {
          bookingCode,
          customerId: customer.id,
          gameId: game.id,
          stationId: station.id,
          startsAt,
          endsAt,
          durationMin: input.durationMin,
          status: "PENDING_PAYMENT",
          subtotal: quote.subtotal,
          discount: quote.discount,
          total: quote.total,
          currency: quote.currency,
          paymentMethod: "COUNTER",
          paymentStatus: "PENDING",
          priceSnapshot: {
            currency: quote.currency,
            subtotal: quote.subtotal,
            discount: quote.discount,
            total: quote.total,
            rules: quote.rules,
            quotedAt: quote.quotedAt,
          },
          qrToken,
          customerNameSnapshot: input.name,
          customerPhoneSnapshot: input.phone,
          customerEmailSnapshot: input.email ?? null,
        },
        select: { id: true, bookingCode: true },
      });

      // 7. Counter payment record (ADR-003/ADR-007 — no provider data stored).
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          method: "COUNTER",
          status: "PENDING",
          amount: quote.total,
          currency: quote.currency,
        },
      });

      // 8. Audit entry WITHOUT PII (SECURITY.md — IDs and code only).
      await tx.auditLog.create({
        data: {
          action: "CREATE",
          entityType: "Booking",
          entityId: booking.id,
          metadata: { bookingCode: booking.bookingCode, durationMin: input.durationMin },
        },
      });

      return {
        bookingCode: booking.bookingCode,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        paymentMethod: "COUNTER",
        gameName: game.name,
        stationName: station.name,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        durationMin: input.durationMin,
        subtotal: quote.subtotal,
        discount: quote.discount,
        total: quote.total,
        currency: quote.currency,
      };
    },
    { timeout: 15_000, maxWait: 8_000 },
  );
}

