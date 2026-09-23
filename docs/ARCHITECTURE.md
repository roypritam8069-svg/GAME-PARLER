# Game Parlour Website — Architecture

## 1. Goal

Secure, maintainable and production-ready system for one physical Game Parlour.

## 2. Recommended Stack

- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Zod
- Vitest
- Playwright
- Open-source QR library

Start with free-tier hosting where practical.

## 3. Database

Production database:
- PostgreSQL
- Prisma ORM

Browser LocalStorage must NOT be the primary database.

LocalStorage may only store:
- Theme
- Language
- UI preferences
- Temporary non-critical state

## 4. Architecture

Customer Browser
→ Next.js
→ Authentication
→ Validation
→ Services
→ PostgreSQL

Services:
- Booking
- Pricing
- Availability
- Payment
- Refund
- Privacy
- Notification
- Analytics
- Backup
- Audit

External integrations:
- Payment Gateway
- WhatsApp Provider
- Optional Cloud Backup

## 5. Booking Engine

Server is authoritative.

Before confirmation:
1. Validate request
2. Validate customer
3. Validate station
4. Validate game
5. Re-check availability
6. Calculate price server-side
7. Create booking transactionally
8. Verify payment
9. Confirm booking
10. Generate Booking ID
11. Generate QR
12. Send WhatsApp if opted in

## 6. Double Booking

Database/server must prevent overlapping confirmed bookings.

Client-side availability alone is never sufficient.

## 7. Booking States

- DRAFT
- PENDING_PAYMENT
- CONFIRMED
- CANCELLED
- COMPLETED
- PAYMENT_FAILED
- REFUND_PENDING
- REFUNDED
- PARTIALLY_REFUNDED
- EXPIRED

## 8. Pricing

Pricing can depend on:
- Game
- Station
- Duration
- Peak/off-peak
- Effective date
- Offer

Confirmed booking stores a historical price snapshot.

## 9. Database Entities

- User
- Customer
- Game
- Station
- PricingRule
- AvailabilityBlock
- Booking
- Payment
- Refund
- Offer
- Notification
- Consent
- AuditLog

## 10. Data Handling

PII examples:
- Customer.name
- Customer.phone
- Customer.email

Dedicated privacy service handles:
- Access
- Masking
- Anonymization
- Export

Other modules should not directly access PII when privacy service mediation is appropriate.

Logging must remove PII before writing.

## 11. Retention

Suggested initial values:
- Financial records: 7 years, subject to applicable requirements
- Unpaid drafts: 90 days
- Notification logs: 180 days
- Audit logs: 1 year

Final legal/business approval is required before production.

Retention jobs:
- Idempotent
- Auditable
- Never directly delete financial records
- May anonymize PII
- May delete expired drafts/logs

PII must never have indefinite retention.

## 12. Encryption

- HTTPS/TLS in transit
- Database encryption at rest where supported
- Backup encryption
- Secrets only through environment variables/secret manager
- Never hard-code secrets

## 13. Authentication

Recommended Owner authentication:
- Email + password
- Strong password hashing
- Secure sessions/cookies
- Rate limiting
- Login protection

2FA can be added later.

## 14. Authorization

All sensitive actions require server-side authorization.

Never rely only on:
- Hidden buttons
- Frontend routes
- Client-side checks

## 15. Payment Security

Never store:
- Card number
- CVV
- Raw card data

Store:
- Provider reference
- Payment status
- Amount
- Currency
- Relevant transaction metadata

Payment success must be verified server-side.

## 16. WhatsApp

Isolated inside Notification Service.

Transactional:
- Booking confirmation
- Booking update
- Cancellation/refund update

Marketing requires separate consent.

## 17. Backup

Recommended:
- Automatic daily backup
- Manual Owner backup
- Local backup
- Optional cloud backup
- Encrypted backup
- Restore verification

## 18. Restore

- Owner authorization required
- Audit entry required
- Never delete live DB first
- Prefer temporary/staging validation
- Verify integrity before production replacement

## 19. Project Structure

game-parlour/
├── app/
├── components/
├── services/
├── lib/
├── prisma/
├── public/
├── tests/
├── docs/
├── .env.example
├── .gitignore
├── README.md
└── package.json
