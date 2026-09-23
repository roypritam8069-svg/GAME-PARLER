"use client";

import type { ReactNode } from "react";

import { useBooking } from "./BookingProvider";

/**
 * Button that starts the booking flow, optionally with a game preselected
 * (e.g. "Book Now" on a Tekken 8 card opens the wizard with Tekken 8
 * already chosen). Renders a real <button> — never a dead anchor.
 */
export default function BookButton({
  gameId,
  label = "Book Now",
  className = "gp-btn gp-btn-primary h-11 px-lg text-body-sm",
  children,
  ariaLabel,
}: {
  gameId?: string;
  label?: string;
  className?: string;
  children?: ReactNode;
  ariaLabel?: string;
}) {
  const { openBooking } = useBooking();

  return (
    <button
      type="button"
      onClick={() => openBooking(gameId)}
      aria-label={ariaLabel}
      className={className}
    >
      {children ?? label}
    </button>
  );
}