"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { useBooking } from "./BookingProvider";

const NAV_LINKS = [
  { href: "#hero", label: "Home" },
  { href: "#games", label: "Games" },
  { href: "#booking", label: "Booking" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
] as const;

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const { openBooking } = useBooking();

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // No scroll listener and no backdrop blur: the navbar is always a solid token
  // surface. This removes a per-scroll handler and the expensive blur layer
  // that DESIGN.md §57 asks the UI to avoid.

  // Scroll spy: mark the section currently in the middle of the viewport.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const targets = ["#hero", ...NAV_LINKS.map((link) => link.href)]
      .map((href) => document.querySelector<HTMLElement>(href))
      .filter((element): element is HTMLElement => element !== null);

    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          setActiveSection(id === "hero" ? "" : `#${id}`);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    for (const target of targets) observer.observe(target);

    return () => observer.disconnect();
  }, []);

  // Mobile drawer: focus trap, Escape close, focus restore, scroll lock.
  useEffect(() => {
    if (!menuOpen) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusable = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      );

    drawer.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu();
    };
    desktopQuery.addEventListener("change", onBreakpointChange);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      desktopQuery.removeEventListener("change", onBreakpointChange);
      previouslyFocused?.focus();
    };
  }, [menuOpen, closeMenu]);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base">

      <div className="gp-container gp-navbar-inner relative flex items-center justify-between gap-lg">
        <a
          href="#hero"
          aria-label="Game Parlour — back to top"
          className="flex items-center gap-sm rounded-sm"
        >
          {/* Brand mark. The same artwork is served as the favicon through the
              app/icon.jpg file convention. */}
          <Image
            src="/logo.jpg"
            alt="Game Parlour"
            width={40}
            height={40}
            className="rounded-lg object-cover"
            priority
          />
          <span className="font-display text-heading-4 text-text-primary">
            Game Parlour
          </span>
        </a>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-xl">
            {NAV_LINKS.map((link) => {
              const isActive = activeSection === link.href;

              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    className={
                      isActive ? "gp-nav-link gp-nav-link-active" : "gp-nav-link"
                    }
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={() => openBooking()}
            className="gp-btn gp-btn-primary hidden h-11 px-lg text-body-sm lg:inline-flex"
          >
            Book Now
          </button>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="gp-btn gp-btn-ghost h-11 w-11 rounded-md lg:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        data-menu-open={menuOpen ? "true" : "false"}
        className={`fixed inset-0 z-60 overflow-hidden lg:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className="gp-backdrop"
          role="presentation"
          onClick={closeMenu}
          aria-hidden="true"
        />

        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          tabIndex={-1}
          className="gp-drawer absolute right-0 top-0 flex h-full w-80 max-w-full flex-col gap-xl border-l border-border-subtle bg-bg-base px-lg py-xl"
        >
          <nav aria-label="Mobile">
            <ul className="flex flex-col gap-xs">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.href;

                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={isActive ? "true" : undefined}
                      className={`flex min-h-11 items-center rounded-md px-md text-body-md transition duration-fast ease-standard hover:bg-bg-hover hover:text-text-primary ${
                        isActive
                          ? "bg-bg-hover text-text-primary"
                          : "text-text-secondary"
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            type="button"
            onClick={() => {
              closeMenu();
              openBooking();
            }}
            data-testid="mobile-book-now"
            className="gp-btn gp-btn-primary h-12 px-xl text-body-md"
          >
            Book Now
          </button>

          <p className="mt-auto border-t border-border-subtle pt-lg text-caption text-text-secondary">
            Physical gaming parlour. Sessions are played at the venue.
          </p>
        </div>
      </div>
    </header>
  );
}
