import { NextResponse } from "next/server";

import { BookingError, createBooking } from "@/services/booking.service";
import { listBookingDurations } from "@/services/pricing.service";
import { bookingRequestSchema } from "@/lib/booking-schema";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/bookings — public booking creation (ARCHITECTURE.md §5).
 *
 * Server-authoritative: the request body carries NO price; price, slot
 * conflicts and station state are re-derived from the database inside a
 * transaction (SECURITY.md "Booking Security", ADR-007).
 * PII from the body is never logged (SECURITY.md "PII").
 */

export const dynamic = "force-dynamic";

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return "local";
}

/** Basic CSRF protection: browsers send Origin on fetch() — reject mismatches. */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

const errorResponse = (status: number, code: string, message: string) =>
  NextResponse.json({ ok: false, code, message }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return errorResponse(403, "FORBIDDEN_ORIGIN", "Request blocked.");
  }

  const limit = rateLimit(`booking-post:${clientKey(request)}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", message: "Too many booking attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Invalid request body.");
  }

  let durations: number[];
  try {
    durations = await listBookingDurations();
  } catch {
    return errorResponse(503, "SERVICE_UNAVAILABLE", "Booking is temporarily unavailable. Please try again.");
  }

  const parsed = bookingRequestSchema(durations).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "VALIDATION",
        message: "Please check the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const booking = await createBooking(parsed.data);
    return NextResponse.json({ ok: true, booking }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingError) {
      return errorResponse(error.httpStatus, error.code, error.message);
    }
    // Never log request bodies or PII (SECURITY.md) — log the error class only.
    console.error("[bookings] unexpected error:", error instanceof Error ? error.name : "unknown");
    return errorResponse(
      503,
      "SERVICE_UNAVAILABLE",
      "We could not complete your booking right now. Please try again in a moment.",
    );
  }
}
