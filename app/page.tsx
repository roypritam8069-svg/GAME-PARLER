import { Suspense } from "react";

import BookButton from "@/components/BookButton";
import GameCard from "@/components/GameCard";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";

import {
  BUSINESS_ADDRESS_LINES,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_TEL,
  GENERIC_WHATSAPP_MESSAGE,
  MAPS_SEARCH_URL,
  waLink,
} from "@/lib/contact";

import type { PublicGame } from "@/services/game.service";
import { listActiveGames } from "@/services/game.service";
import type { PublicOffer } from "@/services/offer.service";
import { listActiveOffers } from "@/services/offer.service";
import type { PublicStation, PublicStationStatus } from "@/services/station.service";
import { listActiveStations } from "@/services/station.service";

/**
 * Home page — Server Component.
 *
 * Games, station information and offers always come from the database.
 * Nothing about the catalogue is hard-coded (PRD.md §3).
 * ISR keeps the page fast while keeping data fresh.
 */
export const revalidate = 60;

/**
 * Data comes exclusively from the services layer (ARCHITECTURE.md §4):
 * Prisma → services/* → this Server Component → typed props.
 * No query logic or catalogue copy lives in the page (RULES.md §9).
 */

const offerDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/* ------------------------------------------------------------------ */
/* Shared section UI                                                   */
/* ------------------------------------------------------------------ */

type StatusPanelProps = {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
};

function InfoGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-text-secondary"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </svg>
  );
}

/** Empty + error state panel (DESIGN.md §43, §44). */
function StatusPanel({ title, description, actionHref, actionLabel }: StatusPanelProps) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-elevated p-2xl">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-md border border-border-subtle bg-bg-surface"
      >
        <InfoGlyph />
      </span>
      <h3 className="mt-lg text-heading-4 text-text-primary">{title}</h3>
      <p className="mt-md max-w-reading text-body-sm text-text-secondary">
        {description}
      </p>
      <a
        href={actionHref}
        className="gp-btn gp-btn-secondary mt-lg h-11 px-lg text-body-sm"
      >
        {actionLabel}
      </a>
    </div>
  );
}

function GameCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface"
    >
      <div className="gp-skeleton aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-md p-lg xl:p-xl">
        <div className="gp-skeleton h-4 w-24" />
        <div className="gp-skeleton h-6 w-3/4" />
        <div className="gp-skeleton h-4 w-full" />
        <div className="gp-skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}

function GamesSkeleton() {
  return (
    <div role="status" aria-label="Loading games">
      <div className="grid grid-cols-1 gap-xl md:grid-cols-2 xl:grid-cols-3">
        <GameCardSkeleton />
        <GameCardSkeleton />
        <GameCardSkeleton />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Games                                                              */
/* ------------------------------------------------------------------ */

async function GamesGrid() {
  let games: PublicGame[] = [];
  let failed = false;

  try {
    games = await listActiveGames();
  } catch {
    // Database errors are never exposed to visitors (RULES.md §2).
    failed = true;
  }

  if (failed) {
    return (
      <StatusPanel
        title="Games could not be loaded"
        description="The games list is temporarily unavailable. Please refresh the page to try again."
        actionHref="/"
        actionLabel="Try again"
      />
    );
  }

  if (games.length === 0) {
    return (
      <StatusPanel
        title="No games are listed yet"
        description="The parlour has not published any active titles yet. New games appear here as soon as they are added to the venue."
        actionHref="#how-it-works"
        actionLabel="See how booking works"
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-xl md:grid-cols-2 xl:grid-cols-3">
      {games.map((game, index) => (
        <li key={game.id} className="h-full">
          <Reveal className="h-full" delay={Math.min(index, 5) * 70}>
            <GameCard
              gameId={game.id}
              name={game.name}
              platform={game.platform}
              description={game.description}
              imageUrl={game.imageUrl}
              price={game.price}
            />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

function GamesSection() {
  return (
    <section
      id="games"
      aria-labelledby="games-heading"
      className="relative scroll-mt-16 border-t border-border-subtle bg-bg-base xl:scroll-mt-20"
    >
      <div className="gp-container py-4xl xl:py-5xl">
        <Reveal>
          <p className="gp-eyebrow">The line-up</p>
          <h2
            id="games-heading"
            className="mt-md text-heading-1 text-text-primary"
          >
            Games ready to play
          </h2>
          <p className="mt-lg max-w-reading text-body-md text-text-secondary">
            Pick a title, then choose your station, date and session length.
            Availability and price are checked on our servers before a booking
            is confirmed.
          </p>
        </Reveal>

        <div className="mt-3xl">
          <Suspense fallback={<GamesSkeleton />}>
            <GamesGrid />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Experience                                                         */
/* ------------------------------------------------------------------ */

function StationGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-accent-secondary"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="12" rx="2.5" />
      <path d="M8 20h8M12 17v3M8 11.5h2.4M9.2 10.3v2.4M15.4 11.4h.01" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-accent-secondary"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function ShieldGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-accent-secondary"
      aria-hidden="true"
    >
      <path d="M12 3.5 5.5 6v6c0 4 2.8 6.9 6.5 8.5 3.7-1.6 6.5-4.5 6.5-8.5V6L12 3.5Z" />
      <path d="m9.5 12 1.8 1.8L15 10" />
    </svg>
  );
}

function ChatGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-accent-secondary"
      aria-hidden="true"
    >
      <path d="M20 12.5c0 3.6-3.6 6.5-8 6.5-1 0-2-.2-2.9-.5L5 20l1.2-3.2A6.4 6.4 0 0 1 4 12.5C4 8.9 7.6 6 12 6s8 2.9 8 6.5Z" />
    </svg>
  );
}

const EXPERIENCE_FEATURES = [
  {
    title: "Dedicated console stations",
    description:
      "Every station runs a single session at a time, so the slot you book is reserved for your group.",
    Icon: StationGlyph,
  },
  {
    title: "Session lengths that fit",
    description:
      "Choose 30 minutes, 1 hour or 2 hours. Pricing follows the game, station and duration you select.",
    Icon: ClockGlyph,
  },
  {
    title: "Server-checked availability",
    description:
      "Slots are validated on our servers before a booking is confirmed, so overlapping sessions are rejected.",
    Icon: ShieldGlyph,
  },
  {
    title: "Booking ID, QR and WhatsApp",
    description:
      "Confirmed bookings receive a Booking ID and QR code, plus a WhatsApp message when you opt in.",
    Icon: ChatGlyph,
  },
] as const;

function ExperienceSection() {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="relative scroll-mt-16 border-t border-border-subtle bg-bg-surface xl:scroll-mt-20"
    >
      <div className="gp-container py-4xl xl:py-5xl">
        <Reveal>
          <p className="gp-eyebrow">The experience</p>
          <h2
            id="experience-heading"
            className="mt-md text-heading-1 text-text-primary"
          >
            Built for real gaming sessions
          </h2>
          <p className="mt-lg max-w-reading text-body-md text-text-secondary">
            A physical gaming lounge with console stations, set session lengths
            and a booking flow that respects your time before you arrive.
          </p>
        </Reveal>

        <ul className="mt-3xl grid grid-cols-1 gap-xl md:grid-cols-2">
          {EXPERIENCE_FEATURES.map((feature, index) => (
            <li key={feature.title}>
              <Reveal delay={Math.min(index, 5) * 70}>
                <article className="flex h-full gap-lg rounded-lg border border-border-subtle bg-bg-elevated p-xl">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-surface"
                  >
                    <feature.Icon />
                  </span>
                  <div>
                    <h3 className="text-heading-4 text-text-primary">
                      {feature.title}
                    </h3>
                    <p className="mt-sm text-body-sm text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stations                                                           */
/* ------------------------------------------------------------------ */

const STATION_STATUS_LABELS: Record<PublicStationStatus, string> = {
  AVAILABLE: "Available",
  DISABLED: "Not bookable",
  MAINTENANCE: "Under maintenance",
};

/** Status is never communicated by colour alone (DESIGN.md §26). */
const STATION_STATUS_DOT: Record<PublicStationStatus, string> = {
  AVAILABLE: "bg-status-success",
  DISABLED: "bg-booking-closed",
  MAINTENANCE: "bg-status-warning",
};

function ConsoleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-accent-secondary"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="12" rx="2.5" />
      <path d="M8 20h8M12 17v3M8 11.5h2.4M9.2 10.3v2.4M15.4 11.4h.01" />
    </svg>
  );
}

async function StationList() {
  let stations: PublicStation[] = [];
  let failed = false;

  try {
    stations = await listActiveStations();
  } catch {
    failed = true;
  }

  if (failed || stations.length === 0) {
    return (
      <p className="rounded-lg border border-border-subtle bg-bg-elevated p-xl text-body-sm text-text-secondary">
        Station details are confirmed while you book, so every guest receives a
        valid slot and a station that is actually free.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-lg sm:grid-cols-2">
      {stations.map((station, index) => (
        <li key={station.id} className="h-full">
          <Reveal className="h-full" delay={Math.min(index, 5) * 70}>
            <article className="flex h-full flex-col gap-md rounded-lg border border-border-subtle bg-bg-elevated p-lg">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border-subtle bg-bg-surface"
              >
                <ConsoleGlyph />
              </span>

              <h3 className="text-heading-4 text-text-primary">
                {station.name}
              </h3>

              <p className="text-body-sm text-text-secondary">
                {station.consoleType}
              </p>

              <p className="mt-auto flex items-center gap-sm text-caption text-text-secondary">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 shrink-0 rounded-full ${STATION_STATUS_DOT[station.status]}`}
                />
                {STATION_STATUS_LABELS[station.status]}
              </p>
            </article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

function StationsSection() {
  return (
    <section
      id="stations"
      aria-labelledby="stations-heading"
      className="relative scroll-mt-16 overflow-hidden border-t border-border-subtle bg-bg-base xl:scroll-mt-20"
    >
      <span className="gp-section-glow" aria-hidden="true" />

      <div className="gp-container py-4xl xl:py-5xl">
        <Reveal>
          <p className="gp-eyebrow">Stations &amp; booking</p>
          <h2
            id="stations-heading"
            className="mt-md text-heading-1 text-text-primary"
          >
            Reserve a station, not a queue
          </h2>
          <p className="mt-lg max-w-reading text-body-md text-text-secondary">
            Booking covers the full flow — game, station, date, time and
            duration. Your slot is held for you and the price is calculated on
            the server when the booking is confirmed.
          </p>
        </Reveal>

        <div className="mt-3xl">
          <Suspense
            fallback={
              <div
                role="status"
                aria-label="Loading stations"
                className="gp-skeleton h-40 w-full"
              />
            }
          >
            <StationList />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Offers                                                             */
/* ------------------------------------------------------------------ */

async function OffersList() {
  let offers: PublicOffer[] = [];
  let failed = false;

  try {
    offers = await listActiveOffers();
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <StatusPanel
        title="Offers could not be loaded"
        description="Current promotions are temporarily unavailable. Please refresh the page to see them again."
        actionHref="/"
        actionLabel="Try again"
      />
    );
  }

  if (offers.length === 0) {
    return (
      <StatusPanel
        title="No offers are running right now"
        description="Active promotions appear here with their validity dates as soon as the parlour starts them."
        actionHref="#booking"
        actionLabel="Book a standard session"
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-xl md:grid-cols-2 xl:grid-cols-3">
      {offers.map((offer, index) => (
        <li key={offer.id} className="h-full">
          <Reveal className="h-full" delay={Math.min(index, 5) * 70}>
            <article className="flex h-full flex-col rounded-lg border border-border-subtle bg-bg-elevated p-xl">
              <p className="text-overline uppercase text-accent-secondary">
                Offer
              </p>
              <h3 className="mt-md text-heading-4 text-text-primary">
                {offer.name}
              </h3>
              {offer.description ? (
                <p className="mt-md text-body-sm text-text-secondary">
                  {offer.description}
                </p>
              ) : null}
              <p className="mt-auto pt-lg font-mono text-caption text-text-secondary">
                Valid until {offerDateFormatter.format(offer.endsAt)}
              </p>
            </article>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

function OffersSection() {
  return (
    <section
      id="offers"
      aria-labelledby="offers-heading"
      className="relative scroll-mt-16 border-t border-border-subtle bg-bg-surface xl:scroll-mt-20"
    >
      <div className="gp-container py-4xl xl:py-5xl">
        <Reveal>
          <p className="gp-eyebrow">Offers &amp; promotions</p>
          <h2
            id="offers-heading"
            className="mt-md text-heading-1 text-text-primary"
          >
            Current offers
          </h2>
          <p className="mt-lg max-w-reading text-body-md text-text-secondary">
            Promotions are set by the venue and validated on the server when
            your booking is confirmed.
          </p>
        </Reveal>

        <div className="mt-3xl">
          <Suspense
            fallback={
              <div
                role="status"
                aria-label="Loading offers"
                className="gp-skeleton h-40 w-full"
              />
            }
          >
            <OffersList />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                       */
/* ------------------------------------------------------------------ */

const BOOKING_STEPS = [
  {
    title: "Choose your game",
    description: "Start from the games running on our station.",
  },
  {
    title: "Pick station, date and time",
    description: "See which stations are free for the slot you want.",
  },
  {
    title: "Set your session length",
    description: "30 minutes, 1 hour or 2 hours, priced by the venue's rules.",
  },
  {
    title: "Add your details",
    description: "Name and WhatsApp number are enough. Email stays optional.",
  },
  {
    title: "Get your Booking ID and QR",
    description:
      "Counter payment is confirmed at the venue, and your QR is your entry pass.",
  },
] as const;

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative scroll-mt-16 border-t border-border-subtle bg-bg-base xl:scroll-mt-20"
    >
      <div className="gp-container py-4xl xl:py-5xl">
        <Reveal>
          <p className="gp-eyebrow">How it works</p>
          <h2
            id="how-it-works-heading"
            className="mt-md text-heading-1 text-text-primary"
          >
            From game to station in five steps
          </h2>
          <p className="mt-lg max-w-reading text-body-md text-text-secondary">
            Every booking follows the same flow, whether you start on this page
            or ask us on WhatsApp.
          </p>
        </Reveal>

        <ol className="mt-3xl flex max-w-reading flex-col gap-xl border-l border-border-subtle pl-lg">
          {BOOKING_STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={Math.min(index, 5) * 70}>
                <div className="flex gap-lg">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated font-mono text-body-sm text-text-primary"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-sm">
                    <h3 className="text-heading-4 text-text-primary">
                      {step.title}
                    </h3>
                    <p className="mt-sm text-body-sm text-text-secondary">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal delay={140}>
          <p className="mt-2xl max-w-reading text-caption text-text-secondary">
            Availability and price are re-checked on the server before a booking
            is confirmed, so the same station time is never sold twice.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Booking CTA                                                        */
/* ------------------------------------------------------------------ */

function BookCtaSection() {
  return (
    <section
      id="booking"
      aria-labelledby="book-heading"
      className="relative scroll-mt-16 border-t border-border-subtle bg-bg-base xl:scroll-mt-20"
    >
      <div className="gp-container py-4xl xl:py-5xl">
        <Reveal>
          <div className="gp-cta-panel relative overflow-hidden rounded-xl border border-border-strong p-2xl xl:p-4xl">
            <p className="gp-eyebrow">Booking</p>
            <h2
              id="book-heading"
              className="mt-md text-heading-1 text-text-primary"
            >
              Ready to play?
            </h2>
            <p className="mt-lg max-w-reading text-body-md text-text-secondary">
              Start with a game — station, date, time and duration come next.
              Pay at the counter when you arrive and keep your Booking ID and QR
              handy.
            </p>

            <div className="mt-2xl flex flex-col gap-md sm:flex-row sm:items-center">
              <BookButton className="gp-btn gp-btn-primary h-12 px-xl text-body-md">
                Book your session
              </BookButton>
              <a
                href="#games"
                className="gp-btn gp-btn-secondary h-12 px-xl text-body-md"
              >
                Choose your game
              </a>
            </div>

            <ul className="mt-2xl flex flex-col gap-sm border-t border-border-subtle pt-lg text-body-sm text-text-secondary sm:flex-row sm:gap-xl">
              <li>Counter payment at the venue</li>
              <li>Booking ID and QR on confirmation</li>
              <li>WhatsApp update when you opt in</li>
            </ul>

            <p className="mt-lg max-w-reading text-caption text-text-secondary">
              Online booking is live: pick a game, station, date and time —
              availability and price are re-checked on our servers before your
              slot is reserved. Prefer WhatsApp? The floating chat button
              carries your selections into the conversation.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* About                                                              */
/* ------------------------------------------------------------------ */

const ABOUT_FACTS = [
  { label: "Session lengths", value: "30 min / 1 hour / 2 hours" },
  { label: "Payment", value: "Counter payment at the venue" },
  { label: "Entry pass", value: "Booking ID + QR per booking" },
  { label: "Location", value: "Dinhata, West Bengal" },
] as const;

function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative scroll-mt-16 border-t border-border-subtle bg-bg-surface xl:scroll-mt-20"
    >
      <span className="gp-section-glow" aria-hidden="true" />

      <div className="gp-container py-4xl xl:py-5xl">
        <div className="grid gap-3xl lg:grid-cols-2 lg:items-start">
          <Reveal>
            <p className="gp-eyebrow">About</p>
            <h2
              id="about-heading"
              className="mt-md text-heading-1 text-text-primary"
            >
              A physical gaming lounge, built for real sessions
            </h2>
            <p className="mt-lg max-w-reading text-body-md text-text-secondary">
              Game Parlour is a single-location gaming parlour in Dinhata, West
              Bengal. This is not online gaming — you book a console station,
              arrive at the venue and play on-site. Choose a title from the
              stations below, pick 30 minutes, 1 hour or 2 hours, and reserve
              your slot before you leave home.
            </p>
            <p className="mt-lg max-w-reading text-body-md text-text-secondary">
              Every booking is validated on our own servers — station, time and
              price are re-checked before a slot is held — and counter payment
              keeps things simple when you arrive.
            </p>
          </Reveal>

          <Reveal delay={70}>
            <ul className="grid gap-lg sm:grid-cols-2">
              {ABOUT_FACTS.map((fact) => (
                <li
                  key={fact.label}
                  className="flex h-full flex-col gap-sm rounded-lg border border-border-subtle bg-bg-elevated p-xl"
                >
                  <span className="text-overline uppercase text-text-secondary">
                    {fact.label}
                  </span>
                  <span className="text-body-sm text-text-primary">
                    {fact.value}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contact                                                            */
/* ------------------------------------------------------------------ */

function MapPinGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MessageGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function ContactSection() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative scroll-mt-16 border-t border-border-subtle bg-bg-base xl:scroll-mt-20"
    >
      <div className="gp-container py-4xl xl:py-5xl">
        <div className="grid gap-3xl lg:grid-cols-2">
          <Reveal>
            <p className="gp-eyebrow">Contact</p>
            <h2
              id="contact-heading"
              className="mt-md text-heading-1 text-text-primary"
            >
              Visit the parlour
            </h2>
            <p className="mt-lg max-w-reading text-body-md text-text-secondary">
              Sessions are played at our physical location. Message or call
              before you come to confirm a slot, ask about a game or check the
              current offers.
            </p>

            <address className="mt-2xl not-italic">
              <span className="text-overline uppercase text-text-secondary">
                Address
              </span>
              <p className="mt-md text-body-md text-text-primary">
                {BUSINESS_ADDRESS_LINES.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </address>

            <a
              href={MAPS_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="contact-directions"
              className="gp-btn gp-btn-secondary mt-xl h-11 px-lg text-body-sm"
            >
              Get Directions
            </a>
          </Reveal>

          <Reveal delay={70}>
            <ul className="grid gap-lg sm:grid-cols-2">
              <li>
                <a
                  href={waLink(GENERIC_WHATSAPP_MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="contact-whatsapp"
                  className="flex h-full gap-lg rounded-lg border border-border-subtle bg-bg-elevated p-xl transition duration-fast ease-standard hover:border-border-accent hover:bg-bg-hover"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-accent-secondary"
                  >
                    <MessageGlyph />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-heading-4 text-text-primary">
                      WhatsApp
                    </span>
                    <span className="mt-sm text-body-sm text-text-secondary">
                      Chat about availability and pricing
                    </span>
                    <span className="mt-md font-mono text-caption text-text-secondary">
                      {BUSINESS_PHONE_DISPLAY}
                    </span>
                  </span>
                </a>
              </li>

              <li>
                <a
                  href={`tel:${BUSINESS_PHONE_TEL}`}
                  data-testid="contact-phone"
                  className="flex h-full gap-lg rounded-lg border border-border-subtle bg-bg-elevated p-xl transition duration-fast ease-standard hover:border-border-accent hover:bg-bg-hover"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-accent-secondary"
                  >
                    <PhoneGlyph />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-heading-4 text-text-primary">
                      Call us
                    </span>
                    <span className="mt-sm text-body-sm text-text-secondary">
                      Talk to the parlour directly
                    </span>
                    <span className="mt-md font-mono text-caption text-text-secondary">
                      {BUSINESS_PHONE_DISPLAY}
                    </span>
                  </span>
                </a>
              </li>

              <li className="sm:col-span-2">
                <a
                  href={MAPS_SEARCH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full gap-lg rounded-lg border border-border-subtle bg-bg-elevated p-xl transition duration-fast ease-standard hover:border-border-accent hover:bg-bg-hover"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-accent-secondary"
                  >
                    <MapPinGlyph />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-heading-4 text-text-primary">
                      Get directions
                    </span>
                    <span className="mt-sm text-body-sm text-text-secondary">
                      Open our address in Google Maps
                    </span>
                  </span>
                </a>
              </li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <GamesSection />
      <ExperienceSection />
      <StationsSection />
      <OffersSection />
      <HowItWorksSection />
      <BookCtaSection />
      <AboutSection />
      <ContactSection />
    </>
  );
}
