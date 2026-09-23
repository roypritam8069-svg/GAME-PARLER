import { NextResponse } from "next/server";

import { getStationsSlotStatus } from "@/services/availability.service";
import { hasActivePricingRules, listBookingDurations, quotePrice } from "@/services/pricing.service";
import type { PriceQuote } from "@/services/pricing.service";
import { VENUE_TIMEZONE_OFFSET } from "@/lib/booking-schema";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/availability?date=YYYY-MM-DD&time=HH:mm&durationMin=60
 *                       &gameId=...&stationId=...   (both optional)
 *
 * Returns real free/busy status for every active station inside the
 * proposed window, plus a server-side price quote when game+station are
 * supplied. Informational for the client — the POST route always re-checks
 * (USER_FLOWS.md §7: client availability is informational only).
 */

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function GET(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() || "local";
  const limit = rateLimit(`availability:${clientIp}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", message: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const time = url.searchParams.get("time") ?? "";
  const durationRaw = url.searchParams.get("durationMin") ?? "";
  const gameId = url.searchParams.get("gameId");
  const stationId = url.searchParams.get("stationId");
  const durationMin = Number(durationRaw);

  if (!DATE_RE.test(date) || !TIME_RE.test(time) || !Number.isInteger(durationMin) || durationMin <= 0) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION", message: "Provide a valid date, time and duration." },
      { status: 400 },
    );
  }

  const startsAt = new Date(`${date}T${time}:00${VENUE_TIMEZONE_OFFSET}`);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION", message: "That date/time is not valid." },
      { status: 400 },
    );
  }
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

  try {
    const stations = await getStationsSlotStatus(startsAt, endsAt);

    let durations: number[] = [];
    let quote: PriceQuote | null = null;
    let pricingConfigured = false;
    try {
      durations = await listBookingDurations();
      pricingConfigured = await hasActivePricingRules();
      if (gameId && stationId) {
        quote = await quotePrice({ gameId, stationId, durationMin, at: startsAt });
      }
    } catch {
      pricingConfigured = false;
    }

    return NextResponse.json({
      ok: true,
      date,
      time,
      durationMin,
      window: { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
      stations,
      quote,
      pricingConfigured,
      durations,
    });
  } catch {
    console.error("[availability] unexpected error");
    return NextResponse.json(
      { ok: false, code: "SERVICE_UNAVAILABLE", message: "Availability could not be loaded. Try again." },
      { status: 503 },
    );
  }
}
