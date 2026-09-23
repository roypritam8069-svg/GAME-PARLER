import { z } from "zod";

/**
 * Shared booking request schema + phone/date/time formatting helpers.
 *
 * Used by BOTH the client wizard (`components/BookingModal.tsx`) and the
 * server route (`app/api/bookings/route.ts`) so validation never drifts.
 * Prices are deliberately absent: the client never sends a price and the
 * server never trusts one (RULES.md §4, ADR-007).
 */

/** Venue timezone: the parlour is in West Bengal, India (UTC+5:30). */
export const VENUE_TIMEZONE_OFFSET = "+05:30";
export const VENUE_TIME_ZONE = "Asia/Kolkata";

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Normalise an Indian mobile number to E.164 `+91XXXXXXXXXX`.
 * Returns null when the input is not a plausible 10-digit mobile number —
 * this is format validation, not a business rule.
 */
export function normalizePhone(raw: string): string | null {
  const compact = raw.replace(/[\s\-().]/g, "");
  let digits = compact;
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("0091")) digits = digits.slice(4);
  else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  return null;
}

/** Build the request schema against the durations the database offers. */
export function bookingRequestSchema(durations: number[]) {
  return z.object({
    gameId: z.string().trim().min(1, "Choose a game."),
    stationId: z.string().trim().min(1, "Choose a station."),
    date: z.string().regex(DATE_RE, "Choose a valid date."),
    time: z.string().regex(TIME_RE, "Choose a valid start time."),
    durationMin: z
      .number()
      .int("Choose a session length.")
      .refine((v) => durations.includes(v), {
        message: `Choose one of the available session lengths (${durations.join(", ")} minutes).`,
      }),
    name: z
      .string()
      .trim()
      .min(2, "Enter your name.")
      .max(80, "Name must be 80 characters or fewer."),
    phone: z
      .string()
      .trim()
      .transform((value, ctx) => {
        const normalized = normalizePhone(value);
        if (!normalized) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Enter a valid 10-digit Indian mobile number.",
          });
          return z.NEVER;
        }
        return normalized;
      }),
    email: z
      .string()
      .trim()
      .max(254, "Email must be 254 characters or fewer.")
      .optional()
      .refine((v) => v === undefined || v === "" || EMAIL_RE.test(v), {
        message: "Enter a valid email address, or leave it blank.",
      })
      .transform((v) => (v ? v : undefined)),
    consentNotifications: z.boolean().default(false),
  });
}

export type BookingRequest = z.infer<ReturnType<typeof bookingRequestSchema>>;

/** Human date label for a venue-local `YYYY-MM-DD` value. */
export function formatBookingDate(date: string): string {
  const m = DATE_RE.exec(date);
  if (!m) return date;
  const d = new Date(`${date}T00:00:00${VENUE_TIMEZONE_OFFSET}`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: VENUE_TIME_ZONE,
  }).format(d);
}

/** Human time label for a 24h `HH:mm` value (kept in Latin numerals, §59). */
export function formatBookingTime(time: string): string {
  const m = TIME_RE.exec(time);
  if (!m) return time;
  const hour = Number(time.slice(0, 2));
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${time.slice(3, 5)} ${suffix}`;
}

/** Session-length label: "30 minutes", "1 hour", "2 hours". */
export function formatDuration(durationMin: number): string {
  if (durationMin === 60) return "1 hour";
  if (durationMin === 120) return "2 hours";
  return `${durationMin} minutes`;
}

/** Venue-local date label from an ISO timestamp (never UTC slicing). */
export function formatBookingDateFromIso(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: VENUE_TIME_ZONE,
  }).format(value);
}

/** Venue-local time label from an ISO timestamp (never UTC slicing). */
export function formatBookingTimeFromIso(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return iso;
  const [hourRaw, minute] = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: VENUE_TIME_ZONE,
  })
    .format(value)
    .split(":");
  const hour = Number(hourRaw);
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${suffix}`;
}