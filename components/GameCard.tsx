"use client";

import { useState } from "react";
import Image from "next/image";

import BookButton from "./BookButton";

export type GameCardPrice = {
  amount: number;
  durationMin: number;
};

export type GameCardProps = {
  /** Game name from the database. Never hard-coded. */
  name: string;
  platform: string;
  description: string | null;
  imageUrl: string | null;
  price: GameCardPrice | null;
  /** Database id — preselects this game when "Book Now" starts the flow. */
  gameId: string;
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

function GamePadGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8 text-text-disabled"
      aria-hidden="true"
    >
      <path d="M7.5 7h9a5.5 5.5 0 0 1 5.4 6.5l-.5 3a2.8 2.8 0 0 1-4.8 1.4l-1-1.1a2.6 2.6 0 0 0-1.9-.8h-3.4a2.6 2.6 0 0 0-1.9.8l-1 1.1a2.8 2.8 0 0 1-4.8-1.4l-.5-3A5.5 5.5 0 0 1 7.5 7Z" />
      <path d="M8.5 11.5v2.2M7.4 12.6h2.2M14.6 12.2h.01M16.6 13.8h.01" />
    </svg>
  );
}

/** "30 min" / "1 hour" / "2 hours" — label only; the number stays in mono. */
function durationLabel(minutes: number): string {
  if (minutes > 0 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${minutes} min`;
}

/**
 * Game card (DESIGN.md §24, COMPONENTS.md §6).
 *
 * Client component only because a cover image needs an `onError` fallback — a
 * missing file must never render a broken image. Everything else is static
 * markup styled by app/globals.css (`.gp-game-card`), so the JS payload stays
 * tiny and the card renders before hydration.
 *
 * Cover art and price both come from the database (services/game.service.ts);
 * nothing about the catalogue is hard-coded here (RULES.md §2).
 */
export default function GameCard({
  name,
  platform,
  description,
  imageUrl,
  price,
  gameId,
}: GameCardProps) {
  // Only a site-absolute path ("/games/ea-fc-25.jpg") or a full URL is a valid
  // next/image src. A bare filename or any other relative value makes
  // next/image throw at render time — which takes the whole card down and
  // surfaces the value in the dev overlay — so an invalid value is treated as
  // "no cover art" and the gradient panel renders instead.
  const src = typeof imageUrl === "string" ? imageUrl.trim() : "";
  const isValidSrc = /^(?:\/|https?:\/\/)/.test(src);

  const [imageFailed, setImageFailed] = useState(false);

  const showImage = isValidSrc && !imageFailed;
  const isRemote = /^https?:\/\//.test(src);

  return (
    <article
      data-game-card
      className="gp-game-card group flex h-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-surface"
    >
      {/* `relative` is required by next/image `fill` below; the aspect ratio
          lives here so the cover keeps a 16:9 box before it loads. */}
      <div className="gp-card-media relative aspect-video w-full overflow-hidden rounded-t-lg bg-bg-elevated">
        {showImage ? (
          <>
            {/* Local files (/games/…) are optimised by next/image; full URLs
                render unoptimized because remotePatterns is intentionally
                empty (next.config.js). `fill` + `object-cover` crops the art to
                the 16:9 box; onError swaps in the premium fallback so a missing
                or unreadable file never becomes a broken image element. */}
            <Image
              src={src}
              alt={`Cover art for ${name}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={false}
              unoptimized={isRemote}
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
            <span className="gp-card-overlay" aria-hidden="true" />
          </>
        ) : (
          <span className="gp-media-fallback flex-col gap-sm" aria-hidden="true">
            {/* Gradient panel (app/globals.css) + the game's initial, so an
                art-less card still reads as *this* game (brief: "gradient +
                game name"). Decoration only — the h3 below carries the full
                name for assistive tech. */}
            <span className="font-display text-display-lg uppercase leading-none text-text-disabled">
              {name.trim().charAt(0)}
            </span>
            <GamePadGlyph />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-md p-lg xl:p-xl">
        <p className="text-overline uppercase text-accent-secondary">
          {platform}
        </p>

        <h3 className="text-heading-3 text-text-primary">{name}</h3>

        {description ? (
          <p className="line-clamp-2 text-body-sm text-text-secondary">
            {description}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-lg border-t border-border-subtle pt-lg">
          <p
            data-price-hint={price ? `${price.amount}:${price.durationMin}` : undefined}
            className="flex flex-wrap items-baseline gap-x-sm"
          >
            {price ? (
              <>
                {/* Numbers stay in JetBrains Mono (DESIGN.md §6); labels use
                    text-secondary, the lightest token that still clears the
                    4.5:1 AA contrast bar on this surface (DESIGN.md §48). */}
                <span className="text-caption text-text-secondary">From</span>
                <span className="font-mono text-body-sm text-text-primary">
                  &#8377;{inrFormatter.format(price.amount)}
                </span>
                <span className="text-caption text-text-secondary">
                  / {durationLabel(price.durationMin)}
                </span>
              </>
            ) : (
              <span className="text-caption text-text-secondary">
                Pricing shown during booking
              </span>
            )}
          </p>

          <BookButton
            gameId={gameId}
            ariaLabel={`Book a session for ${name}`}
            className="gp-btn gp-btn-link h-11 shrink-0 px-md text-body-sm"
          >
            Book Now
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="gp-card-arrow h-4 w-4"
              aria-hidden="true"
            >
              <path d="M3 8h9.5M9 4.5 12.5 8 9 11.5" />
            </svg>
          </BookButton>
        </div>
      </div>
    </article>
  );
}
