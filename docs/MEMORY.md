# Game Parlour — Project Memory

## Project Identity

Single-location physical gaming parlour.

This is a physical venue booking system, not an online gaming platform.

## Business Model

Customers visit the physical parlour to play.

Booking channels:
- Website
- WhatsApp-assisted booking
- Counter/Admin

## Current Decisions

- Single location
- One Owner/Admin
- No membership in MVP
- English + Bengali
- Premium Dark Gaming Lounge
- Online payment + counter payment
- 30m / 1h / 2h
- Game/station pricing
- Peak/off-peak pricing
- Offers/promotions
- Customer cancellation with configurable fee/refund
- Advanced analytics
- Local + cloud backup concept
- Free-tier deployment initially

## Technical Direction

Recommended:
- Next.js
- TypeScript
- Tailwind
- PostgreSQL
- Prisma
- Zod
- Vitest
- Playwright

## Important Rules

- Physical gaming only
- Server-authoritative booking
- Prevent double booking
- Never store raw card data
- PII must be protected
- Payment must be verified server-side
- Do not expose PII in logs
- Do not silently change approved architecture

## Documentation

The authoritative project documents are:
- PRD.md
- ARCHITECTURE.md
- RULES.md
- DESIGN.md
- TASKS.md
- SECURITY.md
- NON-FUNCTIONAL.md
- DECISIONS.md

Do not create additional project rules without approval.

Architecture and implementation decisions must be recorded in DECISIONS.md.
