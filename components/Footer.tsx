import Image from "next/image";

import {
  BUSINESS_PHONE_TEL,
  GENERIC_WHATSAPP_MESSAGE,
  MAPS_SEARCH_URL,
  waLink,
} from "@/lib/contact";

const exploreLinks = [
  { href: "#hero", label: "Home" },
  { href: "#games", label: "Games" },
  { href: "#experience", label: "Experience" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
] as const;

const bookingLinks = [
  { href: "#booking", label: "Book a session" },
  { href: "#stations", label: "Stations" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#offers", label: "Offers" },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border-subtle bg-bg-base">
      <div className="gp-container py-4xl xl:py-5xl">
        <div className="grid gap-2xl md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="flex items-center gap-sm">
              {/* Brand mark. The same artwork is served as the favicon through
                  the app/icon.jpg file convention. */}
              <Image
                src="/logo.jpg"
                alt="Game Parlour"
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
              <span className="font-display text-heading-4 text-text-primary">
                Game Parlour
              </span>
            </p>
            <p className="mt-lg max-w-reading text-body-sm text-text-secondary">
              A physical gaming parlour for console players. Pick a game, book
              a station and session length, then play at the venue. Counter
              payment and a Booking ID with QR are included with every
              reservation.
            </p>
          </div>

          <nav aria-labelledby="footer-explore-heading">
            <h2
              id="footer-explore-heading"
              className="text-overline uppercase text-text-secondary"
            >
              Explore
            </h2>
            <ul className="mt-lg flex flex-col gap-md">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="gp-nav-link rounded-sm text-body-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-booking-heading">
            <h2
              id="footer-booking-heading"
              className="text-overline uppercase text-text-secondary"
            >
              Booking
            </h2>
            <ul className="mt-lg flex flex-col gap-md">
              {bookingLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="gp-nav-link rounded-sm text-body-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-3xl flex flex-col gap-md border-t border-border-subtle pt-xl md:flex-row md:items-center md:justify-between">
          <p className="text-caption text-text-secondary">
            &#169; {year} Game Parlour. All rights reserved.
          </p>
          <p className="text-caption text-text-secondary">
            Game Parlour &#183; PlayStation Parlour &#183; Gaming Zone
          </p>
          <ul className="flex flex-wrap items-center gap-lg">
            <li>
              <a
                href={`tel:${BUSINESS_PHONE_TEL}`}
                className="gp-nav-link rounded-sm text-caption"
                aria-label="Call Game Parlour"
              >
                Call
              </a>
            </li>
            <li>
              <a
                href={waLink(GENERIC_WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="gp-nav-link rounded-sm text-caption"
                aria-label="Chat with Game Parlour on WhatsApp"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={MAPS_SEARCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="gp-nav-link rounded-sm text-caption"
                aria-label="Get directions to Game Parlour"
              >
                Directions
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
