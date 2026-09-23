# ============================================================
# GAME PARLOUR — PART 3B
# Create remaining documentation files
#
# Creates:
#   COMPONENTS.md       (if missing)
#   USER_FLOWS.md
#   SEO.md
#   TESTING.md
#   DEPLOYMENT.md
#   ROADMAP.md
#
# Safe to run multiple times.
# Existing files will be replaced.
# ============================================================

$ErrorActionPreference = "Stop"

$docs = "docs"

New-Item -ItemType Directory -Force $docs | Out-Null

$files = [ordered]@{}

# ============================================================
# COMPONENTS.md
# ============================================================

$files["$docs\COMPONENTS.md"] = @'
# Game Parlour — Component System

This document defines the reusable UI component inventory and
behavior contracts.

DESIGN.md is the absolute visual source of truth.

---

## 1. Component Rules

Every reusable component must:

- Follow DESIGN.md tokens.
- Support required accessibility states.
- Avoid arbitrary colors.
- Avoid arbitrary spacing.
- Avoid arbitrary font sizes.
- Support loading/error/empty states where applicable.
- Use semantic HTML.
- Use Lucide icons only.
- Never use emoji as UI icons.

---

## 2. Layout Components

### AppShell

Responsibilities:

- Global page structure
- Theme
- Language
- Navigation
- Main content

### Container

Widths:

- reading: 680px
- content: 1200px
- wide: 1440px

### Section

Provides standard vertical spacing.

---

## 3. Navigation

### Navbar

Contains:

- Logo
- Navigation
- Language switcher
- Login
- Book Now CTA

Mobile:

- Hamburger
- Right-side drawer

---

## 4. Buttons

Variants:

- Primary
- Secondary
- Ghost
- Danger

States:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading

---

## 5. Cards

Reusable card for:

- Games
- Pricing
- Stations
- Offers
- Analytics
- Booking summary

---

## 6. Game Components

### GameCard

Displays:

- Game image
- Game title
- Platform
- Description
- Price hint
- Booking CTA

### GameGrid

Responsive:

- 1 column mobile
- 2 columns tablet
- 3-4 columns desktop

---

## 7. Station Components

### StationCard

Displays:

- Station name
- Console
- Availability
- Next available time

### AvailabilityTimeline

Displays hourly availability.

States:

- Available
- Booked
- Hold
- Closed

---

## 8. Booking Components

### BookingWizard

Steps:

1. Game
2. Station
3. Date
4. Time
5. Duration
6. Customer
7. Payment
8. Confirmation

### DatePicker

Must support:

- Keyboard navigation
- Locale formatting
- Disabled dates

### TimeSlotPicker

Must support:

- Available
- Selected
- Disabled
- Peak

### BookingSummary

Displays:

- Game
- Station
- Date
- Time
- Duration
- Subtotal
- Discount
- Total

Server-verified total is authoritative.

---

## 9. Customer Components

### CustomerForm

Fields:

- Name
- Phone/WhatsApp
- Email optional
- WhatsApp notification consent

Marketing consent must remain separate.

---

## 10. Payment Components

### PaymentMethodSelector

MVP:

- Counter payment

Future:

- Online gateway

### PaymentStatus

States:

- Pending
- Paid
- Failed
- Refunded
- Partially refunded

---

## 11. Confirmation Components

### BookingConfirmation

Displays:

- Booking ID
- Game
- Station
- Date
- Time
- Duration
- Amount
- Payment status
- QR code

### BookingQRCode

QR must contain only approved non-sensitive booking information.

---

## 12. WhatsApp Components

### WhatsAppConfirmation

MVP:

- Generate pre-filled WhatsApp message
- Owner/customer manually sends

Future:

- Provider API

---

## 13. Admin Components

### AdminShell

Contains:

- Sidebar
- Top bar
- Content

### AdminSidebar

Sections:

- Dashboard
- Bookings
- Games
- Stations
- Pricing
- Offers
- Customers
- Payments
- Availability
- Reports
- Settings

### AdminTable

Features:

- Search
- Filter
- Sort
- Pagination
- Row actions
- Bulk actions

---

## 14. Analytics Components

### MetricCard

Displays:

- Label
- Value
- Delta

### RevenueChart

Displays:

- Daily
- Weekly
- Monthly revenue

### UtilizationChart

Displays:

- Station utilization
- Peak hours

---

## 15. Feedback Components

### Toast

Variants:

- Success
- Error
- Info
- Warning

### Modal

Requirements:

- Focus trap
- Escape close
- Restore focus

### EmptyState

Must explain:

- What is empty
- Why
- What action can be taken

### ErrorState

Must provide:

- Human-readable message
- Retry action where possible

### Skeleton

Used for data-loading states.

---

## 16. Forms

All forms must have:

- Visible labels
- Validation
- Error messages
- Loading state
- Success state
- Keyboard support

Never rely on placeholder-only labels.

---

## 17. Accessibility

Minimum:

- WCAG AA
- Keyboard accessible
- Focus visible
- Semantic HTML
- ARIA only where necessary
- 44px minimum mobile touch target

---

## 18. Component State Contract

Every interactive component should consider:

1. Default
2. Hover
3. Focus
4. Active
5. Disabled
6. Loading
7. Error
8. Empty
9. Success
10. Readonly

Missing applicable states = NOT VERIFIED.

---

## 19. Component Naming

Use PascalCase.

Examples:

- GameCard
- BookingSummary
- StationCard
- AdminTable

Do not create duplicate components with slightly different names.

---

## 20. Component Ownership

Reusable components belong in:

components/

Business logic belongs in:

services/

Database logic belongs in:

lib/db/

Do not place business logic inside presentational components.

---

## 21. Verification

Before considering a component complete:

- [ ] Design tokens verified
- [ ] Responsive behavior verified
- [ ] Accessibility verified
- [ ] Keyboard behavior verified
- [ ] Loading state verified
- [ ] Error state verified
- [ ] Empty state verified
- [ ] Mobile 320px verified
- [ ] Bengali verified where applicable
- [ ] No arbitrary values
- [ ] No forbidden anti-patterns

If any applicable item is unchecked:

NOT VERIFIED.
'@

# ============================================================
# USER_FLOWS.md
# ============================================================

$files["$docs\USER_FLOWS.md"] = @'
# Game Parlour — User Flows

This document defines customer and Owner workflows.

---

## 1. Customer Discovery Flow

Home
→ Games
→ Pricing
→ Availability
→ Book Now

Primary goal:

Convert a visitor into a physical parlour booking.

---

## 2. Browse Games

Home
→ Games
→ Select Game
→ View Details
→ Book This Game

Game information:

- Name
- Image
- Platform
- Description
- Pricing information
- Availability

---

## 3. Booking Flow

Home
→ Book Now
→ Select Game
→ Select Station
→ Select Date
→ Select Time
→ Select Duration
→ Server Price Calculation
→ Customer Details
→ Payment Method
→ Confirmation

The server must re-check:

- Station
- Time
- Duration
- Pricing

before confirmation.

---

## 4. Counter Payment Flow

Customer selects:

Counter Payment

System:

1. Creates pending booking.
2. Reserves station according to booking policy.
3. Owner receives booking information.
4. Owner confirms payment at counter.
5. Payment status becomes paid.
6. Booking becomes confirmed.

---

## 5. Booking Confirmation Flow

Confirmed booking:

→ Generate Booking ID
→ Generate QR
→ Show confirmation
→ Generate WhatsApp message
→ Customer/Owner sends WhatsApp message if opted in

---

## 6. Cancellation Flow

Customer:

Booking
→ Cancel

System:

1. Verify booking ownership/access.
2. Check cancellation window.
3. Calculate refund.
4. Display refund amount.
5. Confirm cancellation.
6. Update booking status.
7. Create refund record where applicable.
8. Notify customer.

---

## 7. Availability Flow

Customer:

Select Date
→ Select Station
→ Select Time
→ Select Duration

Server:

1. Load confirmed bookings.
2. Load holds.
3. Load availability blocks.
4. Check parlour closure.
5. Check station status.
6. Return available slots.

Client availability is informational only.

Server is authoritative.

---

## 8. Concurrent Booking Flow

Customer A and Customer B select the same station/time.

Both requests reach server.

Server:

1. Re-check availability.
2. Start transaction.
3. Attempt reservation.
4. Database constraint/transaction prevents overlap.
5. One request succeeds.
6. Other request receives unavailable response.

Never trust client-side availability.

---

## 9. Owner Login Flow

Admin Login
→ Credentials
→ Server Authentication
→ Secure Session
→ Admin Dashboard

Requirements:

- Rate limiting
- Secure password hashing
- Secure cookie/session
- Server-side authorization

---

## 10. Owner Booking Flow

Admin
→ Bookings
→ Create Booking

Owner selects:

- Customer
- Game
- Station
- Date
- Time
- Duration
- Payment method

Server validates all data.

---

## 11. Game Management Flow

Admin
→ Games
→ Add/Edit Game
→ Save

Fields:

- Name
- Description
- Platform
- Image
- Status

Deletion should normally be archive/disable rather than destructive deletion.

---

## 12. Station Management Flow

Admin
→ Stations
→ Add/Edit Station

Fields:

- Name
- Console
- Status
- Availability

Owner can:

- Disable station
- Block station
- Re-enable station

---

## 13. Pricing Flow

Admin
→ Pricing
→ Create/Edit Rule

Rule may depend on:

- Game
- Station
- Duration
- Peak/off-peak
- Effective date

Confirmed booking stores historical price snapshot.

Future pricing changes must not change old bookings.

---

## 14. Offer Flow

Admin
→ Offers
→ Create Offer
→ Set validity
→ Set discount rules
→ Activate

Server validates offer eligibility.

---

## 15. Payment Flow

MVP:

Booking
→ Counter Payment
→ Owner confirms
→ Paid

Future:

Booking
→ Online Gateway
→ Provider
→ Server Verification
→ Confirmed

Client payment success must never be trusted without server verification.

---

## 16. WhatsApp Flow

Booking confirmed
→ Generate message
→ Customer/Owner chooses WhatsApp
→ Send manually

Marketing consent is separate from transactional notification consent.

---

## 17. Customer Account Flow

Customer:

Login
→ Account
→ Booking History
→ Booking Details

Customer must only access their own records.

---

## 18. Admin Analytics Flow

Admin
→ Reports

Available:

- Revenue
- Bookings
- Popular games
- Station utilization
- Peak hours
- Cancellation
- Refunds
- Payment reports

---

## 19. Parlour Closure Flow

Admin
→ Availability
→ Block Period
→ Select date/time
→ Reason
→ Confirm

Affected future availability must become unavailable.

Existing confirmed bookings require Owner review.

---

## 20. Error Handling

Every important flow must handle:

- Network failure
- Validation failure
- Booking conflict
- Payment failure
- Session expiration
- Server error
- Notification failure

Never show a false success message.

---

## 21. Flow Verification

Every implemented flow must be tested for:

- Happy path
- Invalid input
- Unauthorized access
- Concurrent request
- Failure recovery
- Mobile layout
- Bengali UI where applicable
'@

# ============================================================
# SEO.md
# ============================================================

$files["$docs\SEO.md"] = @'
# Game Parlour — SEO Strategy

SEO must use truthful information about the actual physical business.

---

## 1. SEO Goals

Target local discovery for:

- Game Parlour
- PlayStation Parlour
- Gaming Zone
- PS5 Gaming
- Console Gaming
- Gaming Lounge
- Game Parlour near me
- PlayStation near me

Location keywords must only use the actual business location.

---

## 2. Technical SEO

Required:

- Unique title per page
- Unique meta description
- Canonical URL
- Semantic HTML
- Sitemap
- Robots.txt
- Open Graph metadata
- Twitter/X metadata
- Proper heading hierarchy
- Descriptive image alt text

---

## 3. Local SEO

Business information must remain consistent:

- Business name
- Address
- Phone
- Opening hours
- Google Maps location

Do not publish inaccurate information.

---

## 4. Recommended Page Metadata

### Home

Title:

Game Parlour — Premium Gaming Experience

Description:

Play console games at our physical gaming parlour. Check games, pricing, availability and book your gaming session.

### Games

Title:

Games — Game Parlour

### Pricing

Title:

Gaming Prices — Game Parlour

### Location

Title:

Location & Contact — Game Parlour

---

## 5. Structured Data

Where accurate and applicable, consider:

- LocalBusiness
- Organization
- WebSite
- BreadcrumbList

Never create fake reviews or fake ratings.

---

## 6. Sitemap

Include public pages:

- /
- /games
- /pricing
- /availability
- /offers
- /about
- /location
- /contact
- /terms
- /privacy

Do not include private admin routes.

---

## 7. Robots

Disallow:

- /admin
- Private customer pages
- Internal APIs where appropriate

Allow public pages.

---

## 8. Images

Use:

- WebP
- Correct dimensions
- Descriptive filenames
- Accurate alt text
- Lazy loading below fold

Do not use misleading image descriptions.

---

## 9. Performance

SEO implementation must consider:

- Core Web Vitals
- Image optimization
- Font loading
- Minimal JavaScript
- Server rendering where appropriate

---

## 10. Bengali SEO

Provide Bengali metadata where Bengali pages are implemented.

Language URLs may use:

- /en/
- /bn/

or another documented routing strategy.

Do not mix language routing strategies.

---

## 11. Local Content

Useful truthful content:

- Exact location
- Opening hours
- Available consoles
- Available games
- Pricing
- Booking information
- Contact information
- Directions

Avoid keyword stuffing.

---

## 12. SEO Verification

Before launch:

- [ ] Sitemap works
- [ ] Robots works
- [ ] Canonicals work
- [ ] Metadata verified
- [ ] Mobile layout verified
- [ ] Images have useful alt text
- [ ] No broken links
- [ ] Structured data validated
- [ ] No private pages indexed
'@

# ============================================================
# TESTING.md
# ============================================================

$files["$docs\TESTING.md"] = @'
# Game Parlour — Testing Strategy

Testing is required before a task can be marked VERIFIED.

---

## 1. Testing Layers

### Unit

Use:

- Vitest

Test:

- Pricing
- Refund calculations
- Validation
- Utility functions
- State transitions

### Integration

Test:

- Database operations
- Booking service
- Availability service
- Payment service
- Privacy service

### E2E

Use:

- Playwright

Test:

- Customer booking
- Admin booking
- Cancellation
- Availability
- Authentication

---

## 2. Required Booking Tests

Test:

- Valid booking
- Invalid date
- Invalid duration
- Invalid station
- Invalid game
- Unavailable station
- Overlapping booking
- Concurrent booking
- Price recalculation
- Expired pending booking

---

## 3. Payment Tests

MVP:

- Counter payment creation
- Counter payment confirmation
- Payment status changes

Future:

- Provider success
- Provider failure
- Invalid webhook
- Duplicate webhook
- Payment verification failure
- Refund

Never use real payment credentials in automated tests.

---

## 4. Authorization Tests

Verify:

- Customer cannot access admin
- Customer cannot access another customer's booking
- Unauthenticated user cannot access protected routes
- Owner can access admin routes
- Server rejects forged client permissions

---

## 5. Privacy Tests

Verify:

- PII is not written to logs
- PII is masked where required
- PII export works
- Anonymization is irreversible
- Audit logs contain no PII
- Retention jobs work

---

## 6. UI Tests

Test at:

- 320px
- 375px
- 768px
- 1024px
- 1280px
- 1536px

Verify:

- No horizontal overflow
- Touch targets
- Keyboard navigation
- Focus states
- Loading states
- Empty states
- Error states

---

## 7. Accessibility Tests

Verify:

- Keyboard navigation
- Visible focus
- Semantic landmarks
- Form labels
- Error descriptions
- Accessible names
- Color contrast
- Reduced motion

---

## 8. Bengali Tests

Verify:

- Font loads
- Long Bengali text
- Buttons do not overflow
- Forms remain usable
- Dates/numbers are correct
- Navigation remains usable

---

## 9. Security Tests

Verify:

- Authentication
- Authorization
- CSRF protection where applicable
- Input validation
- Rate limiting
- Secure cookies
- Security headers
- No secrets in client bundle
- No sensitive data in logs

---

## 10. Regression Testing

Every bug fix must include:

1. Reproduction.
2. Fix.
3. Regression test.
4. Verification.

---

## 11. Definition of Done

A task is VERIFIED only when:

- Implementation complete
- Relevant tests pass
- Typecheck passes
- Lint passes
- E2E passes where applicable
- Manual verification completed where applicable
- No known blocker remains

Never claim a test passed without actually running it.

---

## 12. Test Commands

Expected commands:

npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build

If a command is not run:

NOT VERIFIED.

---

## 13. Test Data

Use synthetic test data.

Never use:

- Real customer phone numbers
- Real payment details
- Real credentials
- Real private customer data

---

## 14. CI

CI should eventually run:

1. Install dependencies
2. Typecheck
3. Lint
4. Unit tests
5. Build
6. E2E tests

Failure blocks deployment.
'@

# ============================================================
# DEPLOYMENT.md
# ============================================================

$files["$docs\DEPLOYMENT.md"] = @'
# Game Parlour — Deployment Guide

MVP deployment target:

- Vercel
- Supabase PostgreSQL

See DECISIONS.md for approved architecture decisions.

---

## 1. Prerequisites

Required:

- Git repository
- GitHub account
- Vercel account
- Supabase project
- Production environment variables

---

## 2. Local Preparation

Install dependencies:

npm install

Generate Prisma client:

npm run prisma:generate

Run typecheck:

npm run typecheck

Run tests:

npm run test

Build:

npm run build

Do not deploy if build fails.

---

## 3. Supabase

Create a PostgreSQL project.

Configure:

DATABASE_URL

DIRECT_URL

Production credentials must never be committed.

---

## 4. Prisma

Production schema changes must use migrations.

Development:

npx prisma migrate dev

Production:

npx prisma migrate deploy

Never use:

prisma db push

as the production migration strategy.

---

## 5. Vercel

Connect the Git repository.

Configure:

- Framework: Next.js
- Build command: npm run build
- Install command: npm install

Add environment variables in Vercel.

Never put production secrets in source code.

---

## 6. Environment Variables

Minimum production variables:

DATABASE_URL
DIRECT_URL
NODE_ENV
NEXT_PUBLIC_APP_URL
SESSION_SECRET

Future:

PAYMENT_PROVIDER
PAYMENT_KEY_ID
PAYMENT_KEY_SECRET
PAYMENT_WEBHOOK_SECRET
WHATSAPP_PROVIDER
WHATSAPP_PHONE_NUMBER
WHATSAPP_API_TOKEN

---

## 7. Production Security

Before launch:

- HTTPS enabled
- Secure cookies enabled
- Production secrets configured
- Admin authentication enabled
- Authorization tested
- Security headers verified
- Debug mode disabled
- Error responses sanitized
- PII not exposed

---

## 8. Database Backup

Maintain:

- Automatic database backups where available
- Owner/manual backup
- Independent backup where practical
- Restore testing

A backup that has never been restored/tested is not considered verified.

---

## 9. Restore Procedure

Restore must:

1. Require Owner authorization.
2. Preserve current backup.
3. Prefer staging verification.
4. Validate schema.
5. Validate critical tables.
6. Verify booking integrity.
7. Verify application connectivity.
8. Record audit event.

---

## 10. Deployment Process

Recommended:

Local
→ Tests
→ Git commit
→ Push
→ Vercel preview
→ QA
→ Production deployment

Do not directly deploy untested changes.

---

## 11. Rollback

If deployment causes a critical problem:

1. Stop affected operations if necessary.
2. Identify deployment.
3. Roll back application version.
4. Preserve database state.
5. Investigate migration compatibility.
6. Restore database only when necessary.
7. Record incident.

Never casually roll back database migrations.

---

## 12. Post-Deployment Verification

Check:

- Home
- Games
- Pricing
- Availability
- Booking
- Admin login
- Admin dashboard
- Database connection
- Confirmation
- QR generation
- WhatsApp message generation
- Mobile layout

---

## 13. Domain

Configure custom domain after production deployment.

Verify:

- HTTPS
- www/non-www strategy
- Canonical URLs
- NEXT_PUBLIC_APP_URL
- Sitemap
- Robots

---

## 14. Monitoring

Monitor:

- Application errors
- Booking failures
- Database errors
- Payment failures
- Notification failures
- Deployment failures

Do not log customer PII.

---

## 15. Deployment Definition of Done

Production is VERIFIED only when:

- Build succeeds
- Tests pass
- Database migration succeeds
- Environment variables are configured
- HTTPS works
- Admin authentication works
- Booking flow works
- Availability works
- No critical console/server errors
- Backup exists
- Restore procedure has been tested
'@

# ============================================================
# ROADMAP.md
# ============================================================

$files["$docs\ROADMAP.md"] = @'
# Game Parlour — Product Roadmap

This roadmap separates MVP from future features.

Do not implement future phases without explicit approval.

---

# Phase 0 — Blueprint Lock

Before development:

- [ ] PRD approved
- [ ] Architecture approved
- [ ] Rules approved
- [ ] Design approved
- [ ] Tasks approved
- [ ] Security approved
- [ ] Decisions approved
- [ ] Stack confirmed
- [ ] Database host confirmed
- [ ] Payment approach confirmed
- [ ] WhatsApp approach confirmed
- [ ] Retention values confirmed

Exit:

Blueprint locked.

---

# Phase 1 — Foundation

Build:

- Next.js
- TypeScript
- Tailwind
- Prisma
- PostgreSQL
- Validation
- Base UI
- Authentication foundation

Exit:

Application runs and database connects.

---

# Phase 2 — Public Website

Build:

- Home
- Games
- Pricing
- Offers
- Location
- Contact
- Bengali/English foundation

Exit:

Public website usable.

---

# Phase 3 — Booking Engine

Build:

- Availability
- Date selection
- Time slots
- Duration
- Pricing
- Booking creation
- Double-booking protection
- Booking confirmation
- Booking ID
- QR

Exit:

Customer can complete a valid booking.

---

# Phase 4 — Admin

Build:

- Dashboard
- Bookings
- Games
- Stations
- Pricing
- Availability
- Customers

Exit:

Owner can operate the parlour.

---

# Phase 5 — Payments

MVP:

- Counter payment

Future:

- Online payment gateway
- Webhooks
- Refund automation

Exit:

Payment states are reliable and auditable.

---

# Phase 6 — Notifications

MVP:

- Manual WhatsApp message generation

Future:

- Meta Cloud API
- Automated transactional messages

Exit:

Booking communication works according to consent.

---

# Phase 7 — Analytics

Build:

- Revenue
- Booking count
- Game popularity
- Station utilization
- Peak hours
- Cancellation
- Refund reports

Exit:

Owner can understand business performance.

---

# Phase 8 — Security & Privacy Hardening

Build:

- Rate limiting
- Privacy controls
- PII masking
- Retention jobs
- Audit logging
- Backup verification
- Restore testing

Exit:

Security checklist passes.

---

# Phase 9 — SEO & Performance

Build:

- Metadata
- Sitemap
- Robots
- Structured data
- Local SEO
- Image optimization
- Core Web Vitals improvements

Exit:

SEO and performance checklist passes.

---

# Phase 10 — Production Launch

Complete:

- Production deployment
- Domain
- HTTPS
- Monitoring
- Backup
- Restore verification
- Final E2E tests

Exit:

Production launch approved.

---

# Future — Post-MVP

Potential features:

- Customer accounts
- Online payments
- Automated WhatsApp
- Membership
- Loyalty points
- Tournament management
- Coupons
- Gift cards
- Staff accounts
- Multiple branches
- Advanced analytics
- Customer notifications
- Waitlist
- Recurring bookings

Each future feature requires:

- Requirement update
- Architecture review
- Security review
- Design review
- Task breakdown
- Explicit approval

---

# Explicitly Out of Scope Unless Approved

- Online/remote gaming
- Game streaming
- Native mobile app
- Cryptocurrency payments
- Unapproved AI features
- Unapproved third-party services
- Multiple branches in MVP
'@

# ============================================================
# WRITE FILES
# ============================================================

foreach ($kv in $files.GetEnumerator()) {

    $dir = Split-Path $kv.Key -Parent

    if ($dir) {
        New-Item -ItemType Directory -Force $dir | Out-Null
    }

    Set-Content `
        -Path $kv.Key `
        -Value $kv.Value `
        -Encoding UTF8

    Write-Host "  Created/Updated: $($kv.Key)" -ForegroundColor Green
}

# ============================================================
# VALIDATION
# ============================================================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " PART 3B COMPLETE — DOCUMENTATION" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$expected = @(
    "COMPONENTS.md",
    "USER_FLOWS.md",
    "SEO.md",
    "TESTING.md",
    "DEPLOYMENT.md",
    "ROADMAP.md"
)

$results = foreach ($name in $expected) {

    $path = Join-Path $docs $name

    if (Test-Path $path) {

        $item = Get-Item $path

        [PSCustomObject]@{
            File   = $name
            Status = "OK"
            SizeKB = [math]::Round($item.Length / 1KB, 2)
        }

    } else {

        [PSCustomObject]@{
            File   = $name
            Status = "MISSING"
            SizeKB = 0
        }
    }
}

$results | Format-Table -AutoSize

$missing = $results | Where-Object { $_.Status -eq "MISSING" }

Write-Host ""

if ($missing.Count -eq 0) {

    Write-Host "SUCCESS: All 6 documentation files exist." `
        -ForegroundColor Green

} else {

    Write-Host "ERROR: Some files are missing." `
        -ForegroundColor Red

    $missing | Format-Table -AutoSize

    exit 1
}

Write-Host ""
Write-Host "Current docs directory:" -ForegroundColor Yellow

Get-ChildItem $docs -File |
    Sort-Object Name |
    Select-Object Name, Length, LastWriteTime |
    Format-Table -AutoSize

Write-Host ""
Write-Host "Next step:" -ForegroundColor Cyan
Write-Host "Review the documentation before starting implementation." `
    -ForegroundColor White