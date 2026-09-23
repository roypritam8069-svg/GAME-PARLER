# Game Parlour — Architecture Decision Records (ADR)

This file records important architecture and implementation decisions.
Once a decision is Accepted, changing it requires a new ADR.

## Format

### ADR-000 — Title
- Date: YYYY-MM-DD
- Status: Proposed / Accepted / Superseded
- Context: Why this decision is needed
- Decision: What was decided
- Consequences: Impact and tradeoffs
- Approved by: Owner

---

## ADR-001 — Final Technology Stack

- Date: 2026-09-23
- Status: Accepted
- Context: Need a stable, maintainable, production-ready stack for a
  single-location physical Game Parlour with customer booking and
  Owner admin.
- Decision:
  - Frontend / App: Next.js + TypeScript
  - Styling: Tailwind CSS
  - Database: PostgreSQL
  - ORM: Prisma
  - Validation: Zod
  - Testing: Vitest (unit) + Playwright (E2E)
  - QR: Open-source library
- Consequences:
  - Strong ecosystem and long-term support.
  - Server-rendered app + type safety end-to-end.
  - All schema changes go through Prisma migrations.
- Approved by: Owner

---

## ADR-002 — Database Host (MVP)

- Date: 2026-09-23
- Status: Accepted
- Context: Need a production-capable PostgreSQL host for MVP without
  upfront cost. Local-only DB is not acceptable for a live website.
- Decision: Use Supabase free tier PostgreSQL for MVP.
  - Local PostgreSQL used for development only.
  - Migration to paid tier or self-hosted if usage exceeds free limits.
- Consequences:
  - Zero hosting cost for MVP.
  - Must keep backups (both local + Supabase) per SECURITY.md.
  - Future migration path must be preserved (Prisma allows this).
- Approved by: Owner

---

## ADR-003 — Payment Approach (MVP)

- Date: 2026-09-23
- Status: Accepted
- Context: Online payment providers (Razorpay/PhonePe/Paytm) require
  business KYC, which delays MVP launch. Counter payment already
  covers the core business need.
- Decision:
  - MVP: Counter-only payment.
  - Online gateway integrated in Phase 5 after KYC and business
    verification are complete.
  - Payment Service is written behind a provider-agnostic interface
    so adding a gateway later does not require rewriting booking flow.
- Consequences:
  - No card data stored at any point (already required).
  - Payment state machine already supports PENDING_PAYMENT and
    COUNTER states.
  - Booking confirmation can proceed before online payment exists.
- Approved by: Owner

---

## ADR-004 — WhatsApp Notification Approach (MVP)

- Date: 2026-09-23
- Status: Accepted
- Context: Meta Cloud API / Twilio require business verification and
  ongoing cost. For a small parlour MVP this is unnecessary risk.
- Decision:
  - MVP: Owner manually sends WhatsApp confirmation using a
    pre-filled message template generated from the booking.
  - Customer consent (opt-in) still captured at booking time and
    stored in the Consent entity.
  - Notification Service interface is designed so a provider
    (Meta Cloud API / Twilio) can be added later without touching
    booking code.
- Consequences:
  - No external messaging cost for MVP.
  - Notification delivery is not automatic; Owner is responsible.
  - Notification log entries will reflect manual sends initially.
- Approved by: Owner

---

## ADR-005 — Deployment Target (MVP)

- Date: 2026-09-23
- Status: Accepted
- Context: Need a low-friction, free-tier deployment target that
  matches Next.js capabilities and supports server-side rendering.
- Decision: Deploy on Vercel free tier.
  - Custom domain configured with HTTPS.
  - Environment variables managed via Vercel dashboard (never in repo).
  - Database hosted externally (Supabase, see ADR-002).
- Consequences:
  - Zero cost for MVP.
  - Serverless functions limits apply; must keep booking flow
    within Vercel free tier quotas.
  - Backup and monitoring rely on Vercel + Supabase dashboards.
- Approved by: Owner

---

## ADR-007 — Online Booking Engine (MVP)

- Date: 2026-09-23
- Status: Accepted
- Context: The customer-facing site must start real bookings (Phase 4)
  without a payment gateway (ADR-003) and without automated WhatsApp
  (ADR-004). The schema requires a server-computed `Booking.total`, but
  the database currently contains zero `PricingRule` rows, and inventing
  prices is forbidden (RULES.md §1, DESIGN.md §68).
- Decision:
  - `POST /api/bookings` creates bookings server-authoritatively:
    zod validation → station row lock (`SELECT … FOR UPDATE`) →
    availability re-check (overlapping `PENDING_PAYMENT`/`CONFIRMED`
    bookings + `AvailabilityBlock` rows) → price computed **only** from
    active `PricingRule` rows → transactional create of Customer,
    Consent, Booking, Payment and AuditLog records with a unique
    `bookingCode` + `qrToken`.
  - New bookings are created as `PENDING_PAYMENT` with a counter
    `Payment` (PENDING), matching USER_FLOWS.md §4 counter flow.
  - If no matching `PricingRule` exists the request fails **before any
    row is written** with code `PRICE_NOT_CONFIGURED`; the UI shows an
    honest notice and offers the click-to-chat WhatsApp fallback. No
    price is ever invented and no price is ever accepted from the
    client (RULES.md §4).
  - Availability UI uses native date/time inputs validated against real
    booking/block data; opening hours are not invented because the
    schema has no hours data source (the Owner can constrain hours
    later via `AvailabilityBlock(type: PARLOUR)`).
  - Customer-initiated WhatsApp uses the official `wa.me/916294667229`
    click-to-chat URL with a pre-filled message (Owner-supplied number);
    no provider API and no automated sending (consistent with ADR-004).
- Consequences:
  - Double-booking protection relies on a per-station row lock inside a
    transaction (no schema migration needed); a database exclusion
    constraint would be stronger and is deferred to a future ADR.
  - In-site confirmation is data-blocked until the Owner enters real
    PricingRule amounts; the WhatsApp/counter path works meanwhile.
  - Rate limiting is in-memory per process (best effort on free tier).
- Approved by: Owner

---

## ADR-008 — Hero Parallax & Particles Amendment

- Date: 2026-09-23
- Status: Accepted
- Context: DESIGN.md §23/§46/§57 previously forbade parallax and
  particles outright; the Owner's functionality brief explicitly
  requires keeping subtle parallax and lightweight particles with
  `prefers-reduced-motion` support. DESIGN.md §65/§66 require the
  document to be updated before implementation.
- Decision: DESIGN.md §23, §46 and §57 received dated amendment notes
  limiting the exception to the hero background: scroll-linked
  transform parallax ≤40px on decorative layers only, and ≤16 CSS-only
  particle dots with ≥6s drift/pulse cycles, both fully disabled under
  reduced motion. Implementation uses framer-motion + CSS only — no new
  animation dependency is added.
- Consequences:
  - Tier-A motion rules still apply everywhere else.
  - `verify-nav.mjs` reduced-motion assertions now check that particle
    and parallax animation are disabled rather than that the nodes are
    absent.
- Approved by: Owner

---
## ADR-006 — Data Retention Periods (MVP)

- Date: 2026-09-23
- Status: Accepted
- Context: Needed to define retention windows before implementation
  begins so that privacy and audit rules are unambiguous.
- Decision:
  - Financial records: 7 years (subject to applicable tax law).
  - Unpaid draft bookings: 90 days.
  - Notification logs: 180 days.
  - Audit logs: 1 year (must never contain PII).
  - PII must never have indefinite retention.
- Consequences:
  - Retention jobs must be idempotent and auditable.
  - Financial records may remain while PII is anonymized.
  - Retention values may be revised by Owner; changes require new ADR.
- Approved by: Owner
