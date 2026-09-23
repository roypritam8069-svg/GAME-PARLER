"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import BookingModal from "./BookingModal";

/**
 * Booking flow context (ARCHITECTURE.md §4 presentation boundary: this is
 * UI orchestration only — all business rules live in services/ + API routes).
 *
 * - `openBooking(gameId?)` starts the flow, optionally with a game
 *   preselected from a GameCard "Book Now" button.
 * - The catalogue (games/stations/durations from the database) is fetched
 *   lazily from GET /api/catalogue on first open, with loading/error/retry
 *   states handled inside the modal (DESIGN.md §42/§44).
 * - Focus is restored to whatever opened the modal (COMPONENTS.md §15).
 */

export type CatalogueGame = {
  id: string;
  name: string;
  platform: string;
  description: string | null;
  imageUrl: string | null;
  price: { amount: number; durationMin: number } | null;
};

export type CatalogueStation = {
  id: string;
  name: string;
  consoleType: string;
  status: "AVAILABLE" | "DISABLED" | "MAINTENANCE";
};

export type Catalogue = {
  games: CatalogueGame[];
  stations: CatalogueStation[];
  durations: number[];
};

type BookingContextValue = {
  isOpen: boolean;
  preselectedGameId: string | null;
  catalogue: Catalogue | null;
  catalogueError: string | null;
  catalogueLoading: boolean;
  openBooking: (gameId?: string) => void;
  closeBooking: () => void;
  loadCatalogue: () => void;
  /** Called after a successful booking so the next open starts fresh. */
  resetBooking: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within <BookingProvider>.");
  }
  return context;
}

export default function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preselectedGameId, setPreselectedGameId] = useState<string | null>(null);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  /** Bumped on reset — remounts <BookingModal key={epoch}> with fresh state. */
  const [epoch, setEpoch] = useState(0);

  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const loadingRef = useRef(false);

  const loadCatalogue = useCallback(() => {
    if (loadingRef.current || catalogue) return;
    loadingRef.current = true;
    setCatalogueLoading(true);
    setCatalogueError(null);

    void (async () => {
      try {
        const response = await fetch("/api/catalogue", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("catalogue_unavailable");
        const data: {
          ok: boolean;
          games: CatalogueGame[];
          stations: CatalogueStation[];
          durations: number[];
        } = await response.json();
        if (!data.ok || !Array.isArray(data.games)) throw new Error("catalogue_invalid");
        setCatalogue({ games: data.games, stations: data.stations, durations: data.durations });
      } catch {
        setCatalogueError("Games could not be loaded. Check your connection and try again.");
      } finally {
        loadingRef.current = false;
        setCatalogueLoading(false);
      }
    })();
  }, [catalogue]);

  const openBooking = useCallback(
    (gameId?: string) => {
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (gameId) setPreselectedGameId(gameId);
      setIsOpen(true);
      loadCatalogue();
    },
    [loadCatalogue],
  );

  const closeBooking = useCallback(() => {
    setIsOpen(false);
    const target = restoreFocusRef.current;
    restoreFocusRef.current = null;
    if (target) {
      // Restore focus after the dialog has unmounted (COMPONENTS.md §15).
      requestAnimationFrame(() => target.focus());
    }
  }, []);

  const resetBooking = useCallback(() => {
    setPreselectedGameId(null);
    setEpoch((value) => value + 1);
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({
      isOpen,
      preselectedGameId,
      catalogue,
      catalogueError,
      catalogueLoading,
      openBooking,
      closeBooking,
      loadCatalogue,
      resetBooking,
    }),
    [
      isOpen,
      preselectedGameId,
      catalogue,
      catalogueError,
      catalogueLoading,
      openBooking,
      closeBooking,
      loadCatalogue,
      resetBooking,
    ],
  );

  return (
    <BookingContext.Provider value={value}>
      {children}
      <BookingModal key={epoch} />
    </BookingContext.Provider>
  );
}