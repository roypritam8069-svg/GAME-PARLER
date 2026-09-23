"use client";

import { GENERIC_WHATSAPP_MESSAGE, waLink } from "@/lib/contact";

/**
 * Persistent WhatsApp contact button (Owner requirement).
 *
 * - Official click-to-chat URL (user-initiated; no provider API, ADR-004).
 * - 48px touch target (§49 minimum 44px), safe-area aware, z-30 "floating"
 *   layer (§54). The booking modal renders above it, so it can never block
 *   modal controls; hover lift is a Tier-A small movement and is neutralised
 *   under prefers-reduced-motion (§47).
 */
export default function FloatingWhatsApp() {
  return (
    <a
      href={waLink(GENERIC_WHATSAPP_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Game Parlour on WhatsApp"
      title="Chat with us on WhatsApp"
      className="gp-wa-float"
      data-testid="whatsapp-float"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        {/* Lucide-style MessageCircle (DESIGN.md §53 — no emoji, no mixed libraries) */}
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    </a>
  );
}