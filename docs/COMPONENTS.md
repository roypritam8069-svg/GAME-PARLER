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
