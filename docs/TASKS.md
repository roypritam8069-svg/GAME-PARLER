# Game Parlour — Implementation Tasks

## Execution Rule

Tasks must be completed sequentially.

Do NOT start the next phase until the current phase Exit Criteria passes.

# Phase 0 — Approval & Blueprint Lock

Nothing in Phase 1+ may start until all items are approved.

- [ ] Approve PRD.md
- [ ] Approve ARCHITECTURE.md
- [ ] Approve DESIGN.md
- [ ] Approve RULES.md
- [ ] Approve TASKS.md
- [ ] Confirm final stack
- [ ] Confirm database host
- [ ] Confirm payment provider
- [ ] Confirm WhatsApp approach
- [ ] Confirm retention values

Exit:
All Phase 0 items approved.

# Phase 1 — Foundation

- [ ] Initialize Next.js + TypeScript
- [ ] Configure Tailwind
- [ ] Configure environment variables
- [ ] Configure PostgreSQL
- [ ] Configure Prisma
- [ ] Create initial schema
- [ ] Create first migration
- [ ] Add smoke test

Exit:
Dev server runs, database connects, smoke test passes.

# Phase 2 — Design System

- [ ] Implement design tokens
- [ ] Typography
- [ ] Buttons
- [ ] Cards
- [ ] Forms
- [ ] Navigation
- [ ] Responsive layout

Exit:
Core UI matches DESIGN.md.

# Phase 3 — Public Website

- [ ] Home
- [ ] Games
- [ ] Pricing
- [ ] Availability
- [ ] Offers
- [ ] About
- [ ] Location
- [ ] Contact
- [ ] Bengali/English

Exit:
Customer can browse all public information.

# Phase 4 — Booking

- [ ] Booking flow
- [ ] Availability validation
- [ ] Duration selection
- [ ] Pricing calculation
- [ ] Booking creation
- [ ] Booking ID
- [ ] QR generation
- [ ] Double-booking protection

Exit:
A valid physical booking can be created safely.

# Phase 5 — Payment

- [ ] Payment abstraction
- [ ] Gateway integration
- [ ] Server verification
- [ ] Counter payment
- [ ] Payment states
- [ ] Refund calculation

Exit:
Payment state is trustworthy.

# Phase 6 — Customer

- [ ] Customer account
- [ ] Booking history
- [ ] Booking details
- [ ] Cancellation
- [ ] Refund status

Exit:
Customer can manage bookings.

# Phase 7 — WhatsApp

- [ ] Consent
- [ ] Notification service
- [ ] Booking confirmation
- [ ] Booking update
- [ ] Cancellation/refund update
- [ ] Failure handling

Exit:
Notifications work without breaking bookings.

# Phase 8 — Admin

- [ ] Owner login
- [ ] Dashboard
- [ ] Booking management
- [ ] Game management
- [ ] Station management
- [ ] Pricing management
- [ ] Offers
- [ ] Customers
- [ ] Payments
- [ ] Availability

Exit:
Owner can operate the parlour.

# Phase 9 — Analytics

- [ ] Revenue reports
- [ ] Booking reports
- [ ] Popular games
- [ ] Station utilization
- [ ] Peak hours
- [ ] Payment reports
- [ ] Cancellation reports
- [ ] Refund reports

Exit:
Reports are verified against database records.

# Phase 10 — Privacy & Security

- [ ] PII classification
- [ ] Privacy service
- [ ] PII masking
- [ ] PII denylist
- [ ] Secure exports
- [ ] Retention job
- [ ] Audit logging
- [ ] Rate limiting
- [ ] Authorization tests

Exit:
Security/privacy tests pass.

# Phase 11 — Backup

- [ ] Automatic backup
- [ ] Manual backup
- [ ] Encryption
- [ ] Restore workflow
- [ ] Restore verification

Exit:
Backup and restore are tested.

# Phase 12 — SEO & Production

- [ ] Metadata
- [ ] Sitemap
- [ ] Robots
- [ ] Local SEO
- [ ] Structured data
- [ ] Performance
- [ ] Accessibility
- [ ] Production build

Exit:
Production build passes and critical tests pass.
