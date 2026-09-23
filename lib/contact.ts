/**
 * Documented business facts for Game Parlour (single location).
 *
 * These are Owner-provided contact details, not invented data — they are the
 * one allowed exception to "no hard-coded content", exactly like the Home
 * metadata wording taken from docs/SEO.md §4. Every consumer (Contact
 * section, Footer, floating button, booking messages) imports from here so
 * the number/address exists in exactly one place.
 */

/** Display form of the business phone/WhatsApp number. */
export const BUSINESS_PHONE_DISPLAY = "+91 6294667229";

/** E.164 form used by `tel:` links. */
export const BUSINESS_PHONE_TEL = "+916294667229";

/** WhatsApp business number in click-to-chat international format (91 + number). */
export const BUSINESS_WHATSAPP_NUMBER = "916294667229";

/** Physical address, line by line, exactly as provided by the Owner. */
export const BUSINESS_ADDRESS_LINES = [
  "Modan Mohanpara,",
  "Tomdar Dokan,",
  "Ward No. 3,",
  "Dinhata,",
  "West Bengal,",
  "India",
] as const;

/** Single-line textual address for map searches (no coordinates are invented). */
export const BUSINESS_ADDRESS_QUERY =
  "Modan Mohanpara, Tomdar Dokan, Ward No. 3, Dinhata, West Bengal, India";

/**
 * Google Maps *search* URL using only the textual address
 * (https://developers.google.com/maps/documentation/urls/get-started#search-action).
 */
export const MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  BUSINESS_ADDRESS_QUERY,
)}`;

/** Official WhatsApp click-to-chat link with a pre-filled message. */
export function waLink(message: string): string {
  return `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Generic conversation opener when no booking fields are known yet. */
export const GENERIC_WHATSAPP_MESSAGE =
  "Hello Game Parlour,\n\nI would like to book a gaming session.\n\nPlease share availability and pricing.";

export type BookingWhatsAppFields = {
  game?: string | null;
  station?: string | null;
  date?: string | null;
  time?: string | null;
  durationMin?: number | null;
  name?: string | null;
  phone?: string | null;
  bookingCode?: string | null;
  total?: number | null;
  currency?: string | null;
};

/**
 * Pre-filled click-to-chat message built from whatever the visitor has
 * selected/filled so far (user-initiated only — never sent automatically,
 * per ADR-004 / USER_FLOWS.md §16).
 */
export function buildBookingWhatsAppMessage(fields: BookingWhatsAppFields): string {
  const lines: string[] = ["Hello Game Parlour,", "", "I would like to book a gaming session.", ""];

  if (fields.game) lines.push(`Game: ${fields.game}`);
  if (fields.station) lines.push(`Station: ${fields.station}`);
  if (fields.date) lines.push(`Date: ${fields.date}`);
  if (fields.time) lines.push(`Time: ${fields.time}`);
  if (fields.durationMin) lines.push(`Duration: ${fields.durationMin} minutes`);
  if (fields.name) lines.push(`Name: ${fields.name}`);
  if (fields.phone) lines.push(`Phone: ${fields.phone}`);
  if (fields.bookingCode) lines.push(`Booking code: ${fields.bookingCode}`);
  if (fields.total != null && fields.total > 0) {
    lines.push(`Amount: Rs. ${fields.total}`);
  }

  const hasDetails = Boolean(
    fields.game || fields.station || fields.date || fields.time || fields.name,
  );

  lines.push("");
  if (hasDetails) {
    lines.push("Please confirm availability and booking.");
  } else {
    lines.push("Please share availability and pricing.");
  }

  return lines.join("\n");
}
