"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useBooking } from "./BookingProvider";
import {
  bookingRequestSchema,
  formatBookingDate,
  formatBookingDateFromIso,
  formatBookingTime,
  formatBookingTimeFromIso,
  formatDuration,
} from "@/lib/booking-schema";
import { buildBookingWhatsAppMessage, waLink } from "@/lib/contact";

/**
 * BookingWizard modal (DESIGN.md §28–§31, §39, COMPONENTS.md §8/§15).
 *
 * Steps: Game → Station → Date & time → Details → Confirm → Success.
 * All business rules (availability, price, double-booking prevention) are
 * enforced server-side; this modal only collects input, shows server
 * answers, and renders loading/error/success states (DESIGN.md §42–§45).
 */

const STEPS = ["Game", "Station", "Date & time", "Details", "Confirm"] as const;

type Draft = {
  gameId: string;
  stationId: string;
  date: string;
  time: string;
  durationMin: number;
  name: string;
  phone: string;
  email: string;
  consent: boolean;
};

type CreatedBooking = {
  bookingCode: string;
  status: string;
  paymentStatus: string;
  gameName: string;
  stationName: string;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
};

type Quote = { subtotal: number; discount: number; total: number; currency: string } | null;

type AvailabilityState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      stations: { id: string; free: boolean; conflictCount: number; status: string }[];
      quote: Quote;
      pricingConfigured: boolean;
    };

/** Venue-local calendar date (UTC+5:30) regardless of visitor timezone. */
function venueTodayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function BookingModal() {
  const {
    isOpen,
    preselectedGameId,
    catalogue,
    catalogueError,
    catalogueLoading,
    closeBooking,
    loadCatalogue,
    resetBooking,
  } = useBooking();

  const prefersReducedMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const appliedPreselect = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => ({
    gameId: "",
    stationId: "",
    date: venueTodayIso(),
    time: "",
    durationMin: 60,
    name: "",
    phone: "",
    email: "",
    consent: false,
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [availability, setAvailability] = useState<AvailabilityState>({ status: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ code: string; message: string } | null>(null);
  const [success, setSuccess] = useState<CreatedBooking | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  /* --- Scroll lock + focus (COMPONENTS.md §15 Modal, DESIGN.md §39) --- */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => dialogRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  /* --- Escape closes, Tab is trapped inside the dialog --- */
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!submitting) closeBooking();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
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

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, submitting, closeBooking]);

  /* --- Apply a game preselected from a GameCard "Book Now" --- */
  useEffect(() => {
    if (!preselectedGameId || preselectedGameId === appliedPreselect.current) return;
    appliedPreselect.current = preselectedGameId;
    setSuccess(null);
    setSubmitError(null);
    setFieldErrors({});
    setDraft((current) => ({ ...current, gameId: preselectedGameId }));
    setStep(0);
  }, [preselectedGameId]);

  /* --- Keep the duration valid for what the database offers --- */
  useEffect(() => {
    if (!catalogue) return;
    setDraft((current) =>
      catalogue.durations.includes(current.durationMin)
        ? current
        : { ...current, durationMin: catalogue.durations[0] ?? current.durationMin },
    );
  }, [catalogue]);

  /* --- Real availability + server quote whenever schedule/station known --- */
  useEffect(() => {
    abortRef.current?.abort();
    if (!catalogue || success) return;
    if (step !== 1 && step !== 4) return;
    if (!draft.date || !draft.time || draft.durationMin <= 0) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setAvailability({ status: "loading" });

    const params = new URLSearchParams({
      date: draft.date,
      time: draft.time,
      durationMin: String(draft.durationMin),
    });
    if (draft.gameId) params.set("gameId", draft.gameId);
    if (draft.stationId) params.set("stationId", draft.stationId);

    void (async () => {
      try {
        const response = await fetch(`/api/availability?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("availability_unavailable");
        const data = await response.json();
        if (!data.ok) throw new Error("availability_invalid");
        setAvailability({
          status: "ready",
          stations: data.stations,
          quote: data.quote ?? null,
          pricingConfigured: Boolean(data.pricingConfigured),
        });
      } catch {
        if (controller.signal.aborted) return;
        setAvailability({ status: "error" });
      }
    })();

    return () => controller.abort();
  }, [
    step,
    draft.date,
    draft.time,
    draft.durationMin,
    draft.gameId,
    draft.stationId,
    catalogue,
    success,
  ]);

  /* --- Booking QR (PRD.md §6) — code only, nothing sensitive --- */
  useEffect(() => {
    if (!success) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(success.bookingCode, {
          margin: 1,
          width: 240,
          color: { dark: "#F5F7FA", light: "#12141A" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        /* QR is a convenience — the Booking ID text remains visible. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [success]);


  const selectedGame = useMemo(
    () => catalogue?.games.find((game) => game.id === draft.gameId) ?? null,
    [catalogue, draft.gameId],
  );
  const selectedStation = useMemo(
    () => catalogue?.stations.find((station) => station.id === draft.stationId) ?? null,
    [catalogue, draft.stationId],
  );
  const stationStatus =
    availability.status === "ready"
      ? availability.stations.find((entry) => entry.id === draft.stationId) ?? null
      : null;
  const scheduleKnown = Boolean(draft.date && draft.time);
  const stationBusy = Boolean(scheduleKnown && stationStatus && !stationStatus.free);
  const quote = availability.status === "ready" ? availability.quote : null;
  const pricingConfigured =
    availability.status === "ready" ? availability.pricingConfigured : null;

  const setField = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  /** Per-step validation — the server re-validates everything on confirm. */
  const validateStep = useCallback(
    (target: number): boolean => {
      if (!catalogue) return false;
      const durations = catalogue.durations;

      if (target === 0) {
        if (!draft.gameId) {
          setFieldErrors({ gameId: "Choose a game to continue." });
          return false;
        }
        setFieldErrors({});
        return true;
      }

      if (target === 1) {
        if (!draft.stationId) {
          setFieldErrors({ stationId: "Choose a station to continue." });
          return false;
        }
        if (stationBusy) {
          setFieldErrors({
            stationId:
              "That station is taken for this time. Pick another station or change the time.",
          });
          return false;
        }
        setFieldErrors({});
        return true;
      }

      if (target === 2) {
        const errors: Record<string, string> = {};
        const today = venueTodayIso();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
          errors.date = "Choose a date.";
        } else if (draft.date < today) {
          errors.date = "Choose today or a later date.";
        }
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)) {
          errors.time = "Choose a start time.";
        } else if (draft.date === today) {
          const startsAt = new Date(`${draft.date}T${draft.time}:00+05:30`);
          if (!Number.isNaN(startsAt.getTime()) && startsAt.getTime() < Date.now() - 5_000) {
            errors.time = "That start time has already passed today.";
          }
        }
        if (!durations.includes(draft.durationMin)) {
          errors.durationMin = "Choose a session length.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
      }

      if (target === 3) {
        const partial = bookingRequestSchema(durations).pick({
          name: true,
          phone: true,
          email: true,
          consentNotifications: true,
        });
        const parsed = partial.safeParse({
          name: draft.name,
          phone: draft.phone,
          email: draft.email,
          consentNotifications: draft.consent,
        });
        if (!parsed.success) {
          const flat = parsed.error.flatten().fieldErrors;
          const errors: Record<string, string> = {};
          if (flat.name?.[0]) errors.name = flat.name[0];
          if (flat.phone?.[0]) errors.phone = flat.phone[0];
          if (flat.email?.[0]) errors.email = flat.email[0];
          setFieldErrors(errors);
          return false;
        }
        setFieldErrors({});
        return true;
      }

      return true;
    },
    [catalogue, draft, stationBusy],
  );

  const goNext = useCallback(() => {
    if (!validateStep(step)) return;
    setSubmitError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }, [step, validateStep]);

  const goBack = useCallback(() => {
    setSubmitError(null);
    setFieldErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  /** Final confirm — POST the full schema; the server is authoritative. */
  const submit = useCallback(async () => {
    if (!catalogue || submitting) return;

    const schema = bookingRequestSchema(catalogue.durations);
    const parsed = schema.safeParse({
      gameId: draft.gameId,
      stationId: draft.stationId,
      date: draft.date,
      time: draft.time,
      durationMin: draft.durationMin,
      name: draft.name,
      phone: draft.phone,
      email: draft.email || undefined,
      consentNotifications: draft.consent,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};
      if (flat.name?.[0]) errors.name = flat.name[0];
      if (flat.phone?.[0]) errors.phone = flat.phone[0];
      if (flat.email?.[0]) errors.email = flat.email[0];
      if (flat.date?.[0]) errors.date = flat.date[0];
      if (flat.time?.[0]) errors.time = flat.time[0];
      setFieldErrors(errors);
      if (errors.name || errors.phone || errors.email) setStep(3);
      else if (errors.date || errors.time) setStep(2);
      setSubmitError({ code: "VALIDATION", message: "Please check the highlighted fields." });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data: { ok?: boolean; code?: string; message?: string; booking?: CreatedBooking } =
        await response.json().catch(() => ({ ok: false }));

      if (response.ok && data.ok && data.booking) {
        setSuccess(data.booking);
        setFieldErrors({});
        setStep(5);
        return;
      }

      const code = data.code ?? "UNKNOWN";
      setSubmitError({ code, message: data.message ?? "Booking failed. Please try again." });
      if (code === "STATION_UNAVAILABLE") {
        setAvailability({ status: "idle" });
        setStep(1);
      } else if (code === "GAME_NOT_FOUND") {
        setStep(0);
      } else if (code === "STATION_NOT_FOUND") {
        setStep(1);
      }
    } catch {
      setSubmitError({
        code: "NETWORK",
        message: "Network error — check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [catalogue, draft, submitting]);

  /** Dynamic WhatsApp message built from the current booking state. */
  const whatsappHref = useMemo(() => {
    const dateValue = success
      ? formatBookingDateFromIso(success.startsAt)
      : draft.date
        ? formatBookingDate(draft.date)
        : null;
    const timeValue = success
      ? formatBookingTimeFromIso(success.startsAt)
      : draft.time
        ? formatBookingTime(draft.time)
        : null;

    return waLink(
      buildBookingWhatsAppMessage({
        game: success?.gameName ?? selectedGame?.name,
        station: success?.stationName ?? selectedStation?.name,
        date: dateValue,
        time: timeValue,
        durationMin: success?.durationMin ?? draft.durationMin,
        name: draft.name || null,
        phone: draft.phone || null,
        bookingCode: success?.bookingCode,
        total: success?.total,
      }),
    );
  }, [success, selectedGame, selectedStation, draft]);

  const finish = useCallback(() => {
    closeBooking();
    resetBooking();
  }, [closeBooking, resetBooking]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="gp-modal-layer">
          <motion.div
            className="gp-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            onClick={() => {
              if (!submitting) closeBooking();
            }}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-modal-title"
            tabIndex={-1}
            data-testid="booking-modal"
            className="gp-modal"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.2, 0, 0, 1] }}
          >
            <header className="flex items-start justify-between gap-lg">
              <div>
                <p className="gp-eyebrow">Booking</p>
                <h2 id="booking-modal-title" className="mt-sm text-heading-3 text-text-primary">
                  {success ? "Your slot is reserved" : "Book a session"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!submitting) closeBooking();
                }}
                aria-label="Close booking"
                disabled={submitting}
                className="gp-btn gp-btn-ghost h-11 w-11 shrink-0 rounded-md"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>

            {success ? null : (
              <ol className="gp-steps" aria-label="Booking progress">
                {STEPS.map((label, index) => (
                  <li
                    key={label}
                    aria-current={index === step ? "step" : undefined}
                    data-state={index < step ? "done" : index === step ? "current" : "todo"}
                  >
                    <span aria-hidden="true" className="gp-step-marker">
                      {index < step ? (
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="M3 8.5 6.5 12 13 4.5" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="gp-step-label">{label}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="gp-modal-body">
              {submitError ? (
                <div role="alert" className="gp-banner gp-banner-danger" data-testid="submit-error">
                  {submitError.message}
                </div>
              ) : null}

              {catalogueError && !catalogue ? (
                <div role="alert" className="gp-modal-status">
                  <p className="text-body-sm text-text-secondary">{catalogueError}</p>
                  <button
                    type="button"
                    onClick={loadCatalogue}
                    className="gp-btn gp-btn-secondary mt-lg h-11 px-lg text-body-sm"
                  >
                    Try again
                  </button>
                </div>
              ) : !catalogue ? (
                <div role="status" className="gp-modal-status" data-testid="catalogue-loading">
                  <span className="gp-skeleton h-11 w-full" aria-hidden="true" />
                  <span className="gp-skeleton h-11 w-3/4" aria-hidden="true" />
                  <span className="gp-skeleton h-11 w-5/6" aria-hidden="true" />
                  <p className="mt-md text-caption text-text-secondary">Loading games…</p>
                </div>
              ) : (
                <>
                  {success ? (
<div className="gp-success" role="status" aria-live="polite" data-testid="booking-success">
                      <span className="gp-success-badge" aria-hidden="true">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-6 w-6"
                        >
                          <path d="M5 12.5 9.5 17 19 7.5" />
                        </svg>
                      </span>

                      <p className="mt-lg text-body-sm text-text-secondary">
                        Your slot is reserved. Booking code:
                      </p>
                      <p className="mt-sm font-mono text-heading-3 text-text-primary" data-testid="booking-code">
                        {success.bookingCode}
                      </p>

                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          width={240}
                          height={240}
                          alt={`QR code containing booking ID ${success.bookingCode}`}
                          className="gp-qr"
                        />
                      ) : (
                        <div className="gp-qr-placeholder" role="status">
                          <span className="gp-skeleton" aria-hidden="true" />
                          <p className="mt-md text-caption text-text-secondary">
                            Preparing your QR…
                          </p>
                        </div>
                      )}

                      <dl className="gp-review mt-xl">
                        <div>
                          <dt>Game</dt>
                          <dd>{success.gameName}</dd>
                        </div>
                        <div>
                          <dt>Station</dt>
                          <dd>{success.stationName}</dd>
                        </div>
                        <div>
                          <dt>When</dt>
                          <dd>
                            {formatBookingDateFromIso(success.startsAt)},{" "}
                            {formatBookingTimeFromIso(success.startsAt)}
                          </dd>
                        </div>
                        <div>
                          <dt>Session</dt>
                          <dd>{formatDuration(success.durationMin)}</dd>
                        </div>
                        <div>
                          <dt>Amount</dt>
                          <dd className="font-mono">
                            &#8377;{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(success.total)}
                          </dd>
                        </div>
                        <div>
                          <dt>Payment</dt>
                          <dd>Counter payment — pending</dd>
                        </div>
                      </dl>

                      <div className="mt-xl flex flex-col gap-md sm:flex-row sm:items-center">
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="success-whatsapp"
                          className="gp-btn gp-btn-primary h-12 px-xl text-body-md"
                        >
                          Send booking on WhatsApp
                        </a>
                        <button
                          type="button"
                          onClick={finish}
                          data-testid="booking-done"
                          className="gp-btn gp-btn-secondary h-11 px-lg text-body-sm"
                        >
                          Done
                        </button>
                      </div>

                      <p className="mt-lg text-caption text-text-secondary">
                        Pay at the counter when you arrive. Keep this booking code and QR handy —
                        they are your entry pass.
                      </p>
                    </div>
                  ) : step === 0 ? (
<fieldset className="gp-fieldset">
                      <legend className="gp-label">Choose a game</legend>
                      {catalogue.games.length === 0 ? (
                        <p className="text-body-sm text-text-secondary">
                          No games are listed right now. New titles appear here as soon as they
                          are added — you can still ask us on WhatsApp.
                        </p>
                      ) : (
                        <div className="gp-choice-list">
                          {catalogue.games.map((game) => (
                            <label
                              key={game.id}
                              className="gp-choice"
                              data-selected={draft.gameId === game.id}
                            >
                              <input
                                type="radio"
                                name="booking-game"
                                className="gp-choice-input"
                                checked={draft.gameId === game.id}
                                onChange={() => setField("gameId", game.id)}
                              />
                              <span className="gp-choice-body">
                                <span className="gp-choice-title">{game.name}</span>
                                <span className="gp-choice-meta">
                                  {game.platform}
                                  {game.price
                                    ? ` · from ₹${new Intl.NumberFormat("en-IN", {
                                        maximumFractionDigits: 2,
                                      }).format(game.price.amount)}`
                                    : ""}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                      {fieldErrors.gameId ? (
                        <p className="gp-field-error" role="alert">
                          {fieldErrors.gameId}
                        </p>
                      ) : null}
                    </fieldset>
                  ) : (
step === 1 ? (
                      <fieldset className="gp-fieldset">
                        <legend className="gp-label">Choose a station</legend>
                        <div className="gp-choice-list">
                          {catalogue.stations.map((station) => {
                            const live =
                              availability.status === "ready"
                                ? availability.stations.find((entry) => entry.id === station.id) ??
                                  null
                                : null;
                            const bookable = station.status === "AVAILABLE";
                            const busy = Boolean(live && !live.free);
                            const disabled = !bookable || busy;
                            const statusText = !bookable
                              ? station.status === "MAINTENANCE"
                                ? "Under maintenance"
                                : "Not bookable"
                              : availability.status === "loading"
                                ? "Checking…"
                                : busy
                                  ? "Busy for this time"
                                  : live
                                    ? "Free"
                                    : scheduleKnown
                                      ? "Checking…"
                                      : "Confirmed after date & time";

                            return (
                              <label
                                key={station.id}
                                className="gp-choice"
                                data-selected={draft.stationId === station.id}
                                data-disabled={disabled || undefined}
                              >
                                <input
                                  type="radio"
                                  name="booking-station"
                                  className="gp-choice-input"
                                  checked={draft.stationId === station.id}
                                  disabled={disabled}
                                  onChange={() => setField("stationId", station.id)}
                                />
                                <span className="gp-choice-body">
                                  <span className="gp-choice-title">{station.name}</span>
                                  <span className="gp-choice-meta">{station.consoleType}</span>
                                </span>
                                <span
                                  className="gp-choice-status"
                                  data-tone={
                                    !bookable ? "bad" : busy ? "warn" : live ? "good" : "muted"
                                  }
                                >
                                  {statusText}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="mt-md text-caption text-text-secondary">
                          The server re-checks availability before your booking is created, so
                          the same station time is never sold twice.
                        </p>
                        {fieldErrors.stationId ? (
                          <p className="gp-field-error" role="alert">
                            {fieldErrors.stationId}
                          </p>
                        ) : null}
                      </fieldset>
                    ) : step === 2 ? (
<div className="gp-fieldset">
                      <p className="gp-label" id="booking-when-label">
                        When do you want to play?
                      </p>
                      <div role="group" aria-labelledby="booking-when-label" className="gp-form-grid">
                        <div className="gp-field">
                          <label className="gp-label" htmlFor="booking-date">
                            Date
                          </label>
                          <input
                            id="booking-date"
                            type="date"
                            className="gp-input"
                            min={venueTodayIso()}
                            value={draft.date}
                            onChange={(event) => setField("date", event.target.value)}
                            aria-invalid={fieldErrors.date ? true : undefined}
                            aria-describedby={fieldErrors.date ? "booking-date-error" : undefined}
                          />
                          {fieldErrors.date ? (
                            <p id="booking-date-error" className="gp-field-error" role="alert">
                              {fieldErrors.date}
                            </p>
                          ) : null}
                        </div>

                        <div className="gp-field">
                          <label className="gp-label" htmlFor="booking-time">
                            Start time
                          </label>
                          <input
                            id="booking-time"
                            type="time"
                            step={1800}
                            className="gp-input"
                            value={draft.time}
                            onChange={(event) => setField("time", event.target.value)}
                            aria-invalid={fieldErrors.time ? true : undefined}
                            aria-describedby={fieldErrors.time ? "booking-time-error" : undefined}
                          />
                          {fieldErrors.time ? (
                            <p id="booking-time-error" className="gp-field-error" role="alert">
                              {fieldErrors.time}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div
                        role="radiogroup"
                        aria-label="Session length"
                        className="gp-chip-row mt-xl"
                      >
                        {catalogue.durations.map((duration) => (
                          <label
                            key={duration}
                            className="gp-chip"
                            data-active={draft.durationMin === duration}
                          >
                            <input
                              type="radio"
                              name="booking-duration"
                              className="gp-choice-input"
                              checked={draft.durationMin === duration}
                              onChange={() => setField("durationMin", duration)}
                            />
                            {formatDuration(duration)}
                          </label>
                        ))}
                      </div>
                      {fieldErrors.durationMin ? (
                        <p className="gp-field-error" role="alert">
                          {fieldErrors.durationMin}
                        </p>
                      ) : null}

                      <p className="mt-lg text-caption text-text-secondary">
                        Times are venue local (IST). Availability and price are checked against
                        live bookings when you continue.
                      </p>
                    </div>
                    ) : step === 3 ? (
<div className="gp-fieldset">
                      <p className="gp-label" id="booking-details-label">
                        Who&apos;s playing?
                      </p>
                      <div role="group" aria-labelledby="booking-details-label">
                        <div className="gp-field">
                          <label className="gp-label" htmlFor="booking-name">
                            Name <span aria-hidden="true">*</span>
                          </label>
                          <input
                            id="booking-name"
                            type="text"
                            className="gp-input"
                            autoComplete="name"
                            maxLength={80}
                            required
                            aria-required="true"
                            value={draft.name}
                            onChange={(event) => setField("name", event.target.value)}
                            aria-invalid={fieldErrors.name ? true : undefined}
                            aria-describedby={
                              fieldErrors.name ? "booking-name-error" : "booking-name-hint"
                            }
                          />
                          {fieldErrors.name ? (
                            <p id="booking-name-error" className="gp-field-error" role="alert">
                              {fieldErrors.name}
                            </p>
                          ) : (
                            <p id="booking-name-hint" className="gp-field-hint">
                              Only the details we need for this booking (PRD.md §4).
                            </p>
                          )}
                        </div>

                        <div className="gp-field">
                          <label className="gp-label" htmlFor="booking-phone">
                            Phone / WhatsApp <span aria-hidden="true">*</span>
                          </label>
                          <input
                            id="booking-phone"
                            type="tel"
                            inputMode="tel"
                            className="gp-input"
                            autoComplete="tel"
                            placeholder="98765 43210"
                            required
                            aria-required="true"
                            value={draft.phone}
                            onChange={(event) => setField("phone", event.target.value)}
                            aria-invalid={fieldErrors.phone ? true : undefined}
                            aria-describedby={fieldErrors.phone ? "booking-phone-error" : undefined}
                          />
                          {fieldErrors.phone ? (
                            <p id="booking-phone-error" className="gp-field-error" role="alert">
                              {fieldErrors.phone}
                            </p>
                          ) : null}
                        </div>

                        <div className="gp-field">
                          <label className="gp-label" htmlFor="booking-email">
                            Email (optional)
                          </label>
                          <input
                            id="booking-email"
                            type="email"
                            className="gp-input"
                            autoComplete="email"
                            value={draft.email}
                            onChange={(event) => setField("email", event.target.value)}
                            aria-invalid={fieldErrors.email ? true : undefined}
                            aria-describedby={fieldErrors.email ? "booking-email-error" : undefined}
                          />
                          {fieldErrors.email ? (
                            <p id="booking-email-error" className="gp-field-error" role="alert">
                              {fieldErrors.email}
                            </p>
                          ) : null}
                        </div>

                        <label className="gp-check-row">
                          <input
                            type="checkbox"
                            className="gp-check"
                            checked={draft.consent}
                            onChange={(event) => setField("consent", event.target.checked)}
                          />
                          <span>
                            Send my booking updates on WhatsApp
                            <span className="gp-field-hint">
                              Transactional updates only. Marketing needs separate consent and is
                              never sent from this form.
                            </span>
                          </span>
                        </label>
                      </div>
                    </div>
                    ) : step === 4 ? (
<div data-testid="booking-review">
                      <p className="gp-label">Review your booking</p>

                      <dl className="gp-review">
                        <div>
                          <dt>Game</dt>
                          <dd>{selectedGame?.name ?? "—"}</dd>
                        </div>
                        <div>
                          <dt>Station</dt>
                          <dd>{selectedStation?.name ?? "—"}</dd>
                        </div>
                        <div>
                          <dt>Date</dt>
                          <dd>{formatBookingDate(draft.date)}</dd>
                        </div>
                        <div>
                          <dt>Time</dt>
                          <dd>{formatBookingTime(draft.time)}</dd>
                        </div>
                        <div>
                          <dt>Session</dt>
                          <dd>{formatDuration(draft.durationMin)}</dd>
                        </div>
                        <div>
                          <dt>Name</dt>
                          <dd>{draft.name}</dd>
                        </div>
                        <div>
                          <dt>Phone</dt>
                          <dd className="font-mono">{draft.phone}</dd>
                        </div>
                      </dl>

                      <div className="gp-summary-total" aria-live="polite" data-testid="quote-block">
                        {availability.status === "loading" ? (
                          <p className="text-caption text-text-secondary">
                            Checking availability and price…
                          </p>
                        ) : availability.status === "error" ? (
                          <p className="text-caption text-text-secondary">
                            Availability could not be loaded right now — your slot and price are
                            re-checked on the server when you confirm.
                          </p>
                        ) : quote ? (
                          <p className="flex items-baseline justify-between gap-lg">
                            <span className="text-body-sm text-text-secondary">
                              Confirmed total
                            </span>
                            <span className="font-mono text-heading-3 text-text-primary">
                              &#8377;{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(quote.total)}
                            </span>
                          </p>
                        ) : pricingConfigured === false ? (
                          <div className="gp-banner gp-banner-warning">
                            Pricing for this session hasn&apos;t been published on the website
                            yet. Book via WhatsApp and we&apos;ll confirm the price with you — or
                            pay at the counter when you arrive.
                          </div>
                        ) : (
                          <p className="text-caption text-text-secondary">
                            Your total is calculated on the server from the venue&apos;s pricing
                            rules when you confirm.
                          </p>
                        )}
                      </div>

                      <div className="mt-xl flex flex-col gap-md sm:flex-row sm:items-center">
                        {pricingConfigured === false ? (
                          <>
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid="book-whatsapp"
                              className="gp-btn gp-btn-primary h-12 px-xl text-body-md"
                            >
                              Book via WhatsApp
                            </a>
                            <button
                              type="button"
                              onClick={submit}
                              disabled={submitting || availability.status === "loading"}
                              aria-busy={submitting}
                              className="gp-btn gp-btn-secondary h-11 px-lg text-body-sm"
                            >
                              {submitting ? "Booking…" : "Confirm booking"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={submit}
                              data-testid="confirm-booking"
                              disabled={submitting || availability.status === "loading"}
                              aria-busy={submitting}
                              className="gp-btn gp-btn-primary h-12 px-xl text-body-md"
                            >
                              {submitting ? "Booking…" : "Confirm booking"}
                            </button>
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid="book-whatsapp"
                              className="gp-btn gp-btn-secondary h-11 px-lg text-body-sm"
                            >
                              Book via WhatsApp
                            </a>
                          </>
                        )}
                      </div>

                      <p className="mt-lg text-caption text-text-secondary">
                        Counter payment when you arrive. Your slot is re-checked on the server
                        before it is reserved — the same station time is never sold twice.
                      </p>
                    </div>
                    ) : null
                  )}
                </>
              )}
            </div>

            {success || !catalogue ? null : (
              <footer className="gp-modal-footer">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={submitting}
                    className="gp-btn gp-btn-secondary h-11 px-lg text-body-sm"
                  >
                    Back
                  </button>
                ) : (
                  <span aria-hidden="true" />
                )}
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    data-testid="wizard-continue"
                    className="gp-btn gp-btn-primary h-11 px-lg text-body-sm"
                  >
                    Continue
                  </button>
                ) : null}
              </footer>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
