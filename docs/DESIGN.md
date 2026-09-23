
# Game Parlour — Design System (Pro Max v2)

This file is the ABSOLUTE SOURCE OF TRUTH for all UI/UX.

AI MUST follow this document exactly.

If a design decision is not defined here:
1. Do NOT invent a new token.
2. Do NOT invent a new visual pattern.
3. Use the nearest existing approved token/pattern.
4. If the decision materially changes the design system, STOP and mark it:
   DESIGN DECISION REQUIRED.
5. Do not continue with an unapproved design-system change.

No arbitrary colors.
No arbitrary spacing.
No arbitrary typography.
No random component styles.
No design drift.

---

# 1. DESIGN NORTH STAR

## Product

Premium single-location physical Game Parlour booking platform.

The interface must feel:

- Premium
- Modern
- Cinematic
- Controlled
- Fast
- Trustworthy
- Professional
- Gaming-focused
- Easy to operate

The website must NOT feel like:

- A crypto website
- A Web3 dashboard
- A generic SaaS template
- A casino website
- A cheap neon gaming site
- A template marketplace
- AI-generated UI
- Bootstrap default UI
- Over-animated "vibe coder" UI

---

# 2. DESIGN PRINCIPLES

Priority order:

1. Usability
2. Clarity
3. Accessibility
4. Consistency
5. Performance
6. Premium visual quality
7. Motion

Visual quality must NEVER reduce usability.

---

# 3. VISUAL LANGUAGE

Three pillars:

### Cinematic

Dark, immersive surfaces with controlled contrast.

### Controlled

Accent colors are used sparingly.

### Confident

Large whitespace, clear hierarchy and decisive CTAs.

Design should communicate:

"Professional gaming lounge"

NOT:

"RGB gaming website demo".

---

# 4. COLOR TOKENS

All colors MUST come from these tokens.

## Base

--bg-base       : #0A0B0F
--bg-surface    : #12141A
--bg-elevated   : #181B23
--bg-input      : #1A1D26
--bg-hover      : #232735

## Text

--text-primary  : #F5F7FA
--text-secondary: #A6ADBB
--text-muted    : #707887
--text-disabled : #4A5162

## Borders

--border-subtle : #23262F
--border-strong : #2E3340
--border-accent : #7C3AED

## Accent

--accent-primary   : #7C3AED
--accent-hover     : #8B5CF6
--accent-secondary : #06B6D4
--accent-glow      : rgba(124,58,237,0.15)

## Status

--status-success : #10B981
--status-warning : #F59E0B
--status-danger  : #EF4444
--status-info    : #3B82F6
--status-pending : #A855F7

## Booking Status

AVAILABLE : #10B981
BOOKED    : #EF4444
HOLD      : #F59E0B
CLOSED    : #6B7280

---

# 5. COLOR GOVERNANCE

Rules:

- Never use arbitrary hex values.
- Never use pure #000000.
- Never use pure #FFFFFF.
- Maximum 2 accent colors per screen.
- Accent-primary is reserved for primary actions and active states.
- Accent-secondary is for information/highlight purposes.
- Never use accent colors for normal body text.
- Status colors must only represent actual status.
- Never use status colors decoratively.
- Never use red merely because it looks "gaming".
- Never use gradients on large surfaces.
- Glow is restricted to primary CTA and active/focus states.

---

# 6. TYPOGRAPHY

## Font Families

Headings:
"Inter", system-ui, sans-serif

Body:
"Inter", system-ui, sans-serif

Numeric:
"JetBrains Mono", monospace

Bengali:
"Noto Sans Bengali", "Inter", sans-serif

---

# 7. TYPE SCALE

display-xl : 48px / 1.05 / 700
display-lg : 40px / 1.10 / 700
heading-1  : 32px / 1.15 / 700
heading-2  : 24px / 1.20 / 600
heading-3  : 20px / 1.25 / 600
heading-4  : 18px / 1.30 / 600

body-lg    : 18px / 1.50 / 400
body-md    : 16px / 1.50 / 400
body-sm    : 14px / 1.50 / 400
caption    : 12px / 1.40 / 500
overline   : 11px / 1.40 / 600

Rules:

- No font sizes outside this scale.
- Maximum 2 font weights on a single screen.
- Body letter-spacing: 0.
- Display letter-spacing: -0.02em.
- Bengali uses the same scale.
- Bengali line-height may increase by 10%.

---

# 8. SPACING SYSTEM

Base unit: 4px.

xs   = 4px
sm   = 8px
md   = 12px
lg   = 16px
xl   = 24px
2xl  = 32px
3xl  = 48px
4xl  = 64px
5xl  = 96px

Rules:

- Never invent spacing.
- Never use 20px.
- Never use arbitrary Tailwind spacing.
- Use token names.
- Component-specific dimensions defined in this document are exceptions.

---

# 9. COMPONENT DIMENSION RULE

The general spacing system controls padding/margins.

Explicit component specifications in this document may define:

- Height
- Width
- Grid size
- Icon size
- Border width
- Row height

These values are considered APPROVED component tokens.

Do not replace them with arbitrary values.

---

# 10. RADIUS

--radius-sm   : 6px
--radius-md   : 10px
--radius-lg   : 16px
--radius-xl   : 20px
--radius-full : 9999px

Usage:

sm   → small badges
md   → inputs/buttons
lg   → cards
xl   → hero/modals
full → pills/avatars

---

# 11. ELEVATION

--shadow-sm :
0 1px 2px rgba(0,0,0,0.4)

--shadow-md :
0 4px 12px rgba(0,0,0,0.5)

--shadow-lg :
0 12px 32px rgba(0,0,0,0.6)

--shadow-glow :
0 0 0 1px rgba(124,58,237,0.4),
0 0 24px rgba(124,58,237,0.25)

Rules:

- Prefer borders over shadows.
- Maximum 2 shadows stacked.
- Glow only on approved elements.
- Never create custom shadows.

---

# 12. LAYOUT SYSTEM

Content max-width:
1200px

Wide sections:
1440px

Reading text:
680px

Admin:
1440px

Grid:

12 columns
24px gutter

---

# 13. BREAKPOINTS

sm  : 640px
md  : 768px
lg  : 1024px
xl  : 1280px
2xl : 1536px

Customer:

Mobile-first.

Admin:

Desktop-first but tablet usable.

---

# 14. CONTAINER RULES

Customer mobile:

Horizontal padding = lg.

Customer desktop:

Horizontal padding = 2xl.

Content must remain centered.

Never allow text to stretch across extremely wide screens.

Reading content:

Maximum 680px.

---

# 15. PAGE COMPOSITION

Every major page should follow:

1. Navigation
2. Page context
3. Primary content
4. Supporting content
5. Primary action
6. Footer / supporting navigation

Avoid unnecessary sections.

Each screen must have one clear primary purpose.

---

# 16. CTA HIERARCHY

Priority:

1. Primary CTA
2. Secondary CTA
3. Tertiary/Ghost action
4. Destructive action

Rules:

- Maximum ONE primary CTA per screen.
- Secondary actions must never visually compete with primary CTA.
- Destructive actions must use danger styling.
- Never use multiple purple glowing buttons on one screen.

---

# 17. BUTTON SYSTEM

## Primary

Background:
accent-primary

Text:
text-primary

Hover:
accent-hover

## Secondary

Background:
bg-elevated

Border:
border-strong

Text:
text-primary

## Ghost

Background:
transparent

Text:
text-secondary

Hover:
bg-hover

## Danger

Background:
status-danger

Text:
text-primary

---

# 18. BUTTON SIZES

sm:

32px height

md:

40px height

lg:

48px height

Mobile touch target:

minimum 44x44px.

States:

- Default
- Hover
- Focus
- Active
- Disabled
- Loading

Active:

scale 0.98

Never use:

- Bounce
- Elastic animation
- Flashing
- Infinite animation

---

# 19. INPUT SYSTEM

Height:

44px

Background:

bg-input

Border:

1px border-subtle

Radius:

radius-md

Padding:

lg

Label:

body-sm

Label must ALWAYS appear above the input.

Never rely only on placeholder text.

---

# 20. INPUT STATES

Every input must support:

- Default
- Hover
- Focus
- Filled
- Disabled
- Readonly
- Error
- Success
- Loading

Focus:

border-accent
ring using accent-glow

Error:

status-danger

Success:

status-success

---

# 21. FORM RULES

- Labels are mandatory.
- Required fields must be programmatically marked.
- Errors appear below fields.
- Errors must explain how to fix the problem.
- Browser autofill must remain functional.
- Never disable paste unnecessarily.
- Never clear valid user input because another field failed.
- Preserve form state after validation failure.

---

# 22. NAVBAR

Mobile:

64px

Desktop:

72px

Position:

sticky top 0

z-index:

50

Background:

bg-base

Border:

bottom border-subtle

Desktop:

Logo
→ Navigation
→ Language
→ Login
→ Book Now

Mobile:

Logo
→ Menu button

Menu:

Full-height drawer.

Animation:

250ms.

Focus trap required.

Escape closes drawer.

---

# 23. HERO

Hero must contain:

Optional overline

display-xl headline

body-lg description

Primary CTA

Optional secondary CTA

Maximum:

2 CTAs.

Background:

Dark photography with overlay.

OR controlled gradient using approved tokens.

Forbidden:

- Autoplay video
- Particles
- Animated gradients
- Busy background
- Excessive glow

> **AMENDMENT — 2026-09-23 (Owner directive, recorded per §65/§66):**
> The hero may additionally carry (a) one *subtle scroll-parallax* applied to
> the existing static layers — transform-only, maximum 40px total travel,
> bound to scroll progress (never scroll-jacking), and (b) one *lightweight
> particle layer* — maximum 16 dots at fixed positions, CSS-only drift/pulse
> (≤6px travel, ≥6s cycles). Both must be fully disabled under
> `prefers-reduced-motion: reduce`, must not touch text/content layers, and
> do not permit blur, video or animated gradients. All other entries above
> remain forbidden.

---

# 24. GAME CARD

Image:

16:9

Object-fit:

cover

Card:

bg-surface
border-subtle
radius-lg

Content:

Title
Platform
Description/meta
Price hint

Hover:

border accent-hover
translateY(-2px)

No heavy glow.

---

# 25. GAME DETAIL PAGE

Hierarchy:

Game image
Game title
Platform
Description
Available stations
Pricing
Availability
Book Now

Primary CTA:

Book Now.

Never hide booking action below excessive content.

---

# 26. STATION AVAILABILITY

Each station shows:

Station name
Console
Status
Next available time
Timeline

Status:

AVAILABLE
BOOKED
HOLD
CLOSED

Status must use:

Color + text + icon/pattern.

Never rely on color alone.

---

# 27. TIME SLOT PICKER

Mobile:

4 columns.

Desktop:

6 columns.

Gap:

sm.

States:

Default
Selected
Disabled
Peak
Unavailable
Loading

Selected:

accent-primary.

Disabled:

opacity 0.3.

Booked:

muted visual treatment.

Never make every unavailable slot bright red.

---

# 28. BOOKING FLOW

Booking flow must be visually simple.

Step order:

1. Game
2. Station
3. Date
4. Time
5. Duration
6. Customer details
7. Price confirmation
8. Payment
9. Confirmation

Progress indicator must clearly show:

Current
Completed
Remaining

Never make the user guess what step they are on.

---

# 29. BOOKING SUMMARY

Desktop:

Sticky right column.

Mobile:

Sticky bottom sheet.

Must display:

Game
Station
Date
Time
Duration
Subtotal
Discount
Total

Total must be server-verified.

Never present client-calculated pricing as final.

Use:

"Confirmed total"

instead of:

"Calculated price"

---

# 30. PRICE DISPLAY

Prices use:

JetBrains Mono.

Currency:

₹

Examples:

₹499
₹1,299

Never mix different numeric fonts.

Discount display:

Original price muted/struck.

Current price prominent.

Do not exaggerate discount visually.

---

# 31. BOOKING CONFIRMATION

Confirmation page must immediately show:

Success state

Booking ID

Date

Time

Station

Game

Duration

Amount

Payment status

QR

Location

Directions

WhatsApp status

Primary action:

View Booking

Secondary:

Get Directions

---

# 32. BOOKING QR

QR must:

- Have sufficient contrast.
- Have adequate quiet zone.
- Remain scannable on mobile.
- Not contain unnecessary decorative overlays.
- Never rely on color alone.

Booking ID must remain readable separately.

---

# 33. CUSTOMER ACCOUNT

Primary sections:

Overview
Bookings
Upcoming
Past
Profile
Preferences

Booking history must prioritize:

Date
Game
Station
Status
Amount
Booking ID

Avoid unnecessary customer data exposure.

---

# 34. ADMIN DESIGN

Admin is a different visual environment from customer pages.

Priority:

1. Efficiency
2. Information density
3. Clarity
4. Speed

Admin layout:

Sidebar:
240px

Top bar:
56px

Content:

Fluid.

---

# 35. ADMIN SIDEBAR

Items:

Dashboard
Bookings
Games
Stations
Pricing
Offers
Customers
Payments
Availability
Reports
Settings

Active item:

Subtle accent-primary indicator.

Never use large glowing active backgrounds.

---

# 36. ADMIN DASHBOARD

Dashboard hierarchy:

Top:

Key metrics.

Middle:

Bookings/revenue trends.

Bottom:

Operational data.

Recommended metrics:

Revenue
Bookings
Occupancy
Popular games
Peak hours
Pending payments
Cancellations

Do not show meaningless metrics simply to fill space.

---

# 37. ANALYTICS CARDS

Label:

overline

Value:

display-lg

Numbers:

JetBrains Mono

Delta:

Small chip with icon.

Charts:

Minimal.

No 3D charts.

No excessive gradients.

No animated chart entry unless explicitly useful.

---

# 38. ADMIN TABLE

Desktop:

Row height 48px.

Header sticky.

Numbers:

Right aligned.

Actions:

Three-dot menu.

Selected row:

3px left accent border.

Hover:

bg-hover.

Mobile:

Use responsive card/table transformation.

Never force unreadable horizontal tables on 320px screens.

---

# 39. MODALS

Backdrop:

rgba(0,0,0,0.6)

Blur:

4px

Background:

bg-elevated

Radius:

radius-lg

Padding:

2xl

Widths:

Small: 480px
Medium: 640px
Large: 800px

Required:

- Focus trap
- Escape
- Restore focus
- Accessible title
- Accessible description

---

# 40. CONFIRMATION MODALS

Destructive confirmation must explain:

What will happen.

What cannot be undone.

Available alternatives.

Example:

Delete game?

"This will remove the game from future availability. Existing booking history will remain."

Avoid vague:

"Are you sure?"

---

# 41. TOAST SYSTEM

Desktop:

Top-right.

Mobile:

Bottom-center.

Maximum:

3 visible.

Duration:

4 seconds.

Variants:

Success
Error
Info
Warning

Toasts must not contain critical information that disappears before the user can read it.

---

# 42. LOADING SYSTEM

Use:

Skeleton for content loading.

Spinner only for:

- Button actions
- Very short operations
- Blocking operations

Never show a spinner for an operation expected to take less than 200ms.

Skeletons must approximate final content dimensions.

---

# 43. EMPTY STATES

Every data-driven page must define an empty state.

Required:

- Clear explanation
- Relevant icon/illustration
- Optional primary action

Never show:

"Nothing here."

Instead explain why it is empty.

---

# 44. ERROR STATES

Every major page must have:

- Loading
- Empty
- Error
- Retry

Errors must:

- Explain the problem.
- Avoid technical stack traces.
- Provide next action.

Example:

"Availability could not be loaded."

"Try again."

---

# 45. SUCCESS STATES

Success must be visually distinct but restrained.

Use:

status-success

Never:

- Confetti
- Flashing animation
- Excessive green glow

---

# 46. MOTION SYSTEM

Instant:

100ms

Fast:

150ms

Normal:

250ms

Slow:

400ms

Standard easing:

cubic-bezier(0.2,0,0,1)

Exit:

cubic-bezier(0.4,0,1,1)

Allowed:

- Fade
- Small slide
- Scale 0.98 → 1
- Small hover movement
- Skeleton shimmer

Forbidden:

- Parallax
- Particle systems
- Bounce
- Elastic content
- Flashing
- Auto-rotating carousel
- Scroll-jacking
- Infinite decorative animations

> **AMENDMENT — 2026-09-23 (Owner directive, recorded per §65/§66):**
> Bounded exceptions now apply, limited to the hero background only:
>
> - *Parallax* — allowed solely as scroll-linked transform on decorative
>   hero layers, ≤40px travel, never on text/content, never scroll-jacking.
> - *Particle systems* — allowed solely as ≤16 lightweight CSS dots with
>   slow drift/pulse; no canvas/WebGL/JS particle libraries.
> - *Infinite decorative animations* — allowed solely for those particle
>   cycles and the skeleton shimmer already in use; every such loop must be
>   fully disabled under `prefers-reduced-motion: reduce`.
>
> All other forbidden motion stays forbidden.

---

# 47. REDUCED MOTION

Must support:

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

---

# 48. ACCESSIBILITY

Minimum:

WCAG AA.

Requirements:

- Body contrast ≥ 4.5:1
- Large text ≥ 3:1
- UI controls ≥ 3:1
- Visible focus state
- Keyboard navigation
- Semantic HTML
- aria-label where required
- aria-live for dynamic messages
- Accessible form errors
- Accessible modal behavior

Never:

outline: none;

without replacement focus styling.

---

# 49. TOUCH

Minimum:

44x44px.

Spacing:

minimum 8px between touch targets.

Never place destructive and primary actions immediately adjacent without separation.

---

# 50. RESPONSIVE DESIGN

## Mobile <768px

- Single column
- Hamburger
- Sticky booking CTA
- Responsive cards
- Horizontal scroll only when unavoidable
- Minimum 44px touch target

## Tablet 768-1024px

- 2-column layouts where useful
- Collapsible admin sidebar
- Larger content padding

## Desktop ≥1024px

- Multi-column layouts
- Sticky booking summary
- Full admin sidebar

---

# 51. 320PX RULE

The website MUST remain usable at 320px width.

Test:

- Navbar
- Hero
- Game cards
- Forms
- Booking flow
- Time picker
- Confirmation
- Admin critical screens

No:

- Text clipping
- Horizontal page scroll
- Overlapping buttons
- Hidden essential actions

---

# 52. IMAGES

Approved aspect ratios:

Hero:

16:9

Game cards:

16:9

Avatars:

1:1

Supporting cards:

4:3

Formats:

Prefer WebP/AVIF where supported.

Rules:

- Lazy-load below-fold images.
- Explicit width/height to reduce layout shift.
- Use object-fit: cover where appropriate.
- Avoid generic stock imagery.
- Production imagery should use real parlour photography unless approved otherwise.

---

# 53. ICON SYSTEM

Use:

Lucide Icons.

Sizes:

16px inline
20px default
24px large
32px hero

Stroke:

1.5px.

Rules:

- Never mix icon libraries.
- Never use emoji as UI icons.
- Icon-only buttons require aria-label.
- Icons must have semantic meaning.

---

# 54. Z-INDEX SCALE

Use only:

z-10  → local overlays
z-20  → dropdowns
z-30  → floating elements
z-40  → sticky UI
z-50  → navbar
z-60  → drawer
z-70  → modal
z-80  → modal overlay
z-90  → critical system UI

Never invent random z-index values.

---

# 55. DESIGN TOKENS + TAILWIND

Every design token must exist as:

1. CSS variable
2. Tailwind theme token

Examples:

bg-bg-base
bg-bg-surface
bg-bg-elevated
text-text-primary
text-text-secondary
border-border-subtle
rounded-lg
p-xl

Forbidden:

text-[#123456]
p-[17px]
mt-[13px]

If a required token does not exist:

STOP.

Add the token to DESIGN.md first.

Then implement it.

---

# 56. COMPONENT STATE CONTRACT

Every interactive component MUST support where applicable:

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

Missing state:

NOT VERIFIED.

---

# 57. PERFORMANCE DESIGN RULES

UI must avoid unnecessary visual performance cost.

Rules:

- Avoid large background videos.
- Avoid particle systems.
- Avoid expensive blur layers.
- Avoid excessive box shadows.
- Lazy-load below-fold images.
- Prevent layout shift.
- Use optimized fonts.
- Avoid unnecessary client-side JavaScript.
- Prefer CSS transitions over JavaScript animation.
- Avoid continuous animation.

> **AMENDMENT — 2026-09-23 (Owner directive, per §65/§66):** particle usage
> is limited to the bounded hero exception defined in §23/§46 (CSS-only,
> ≤16 dots, disabled under reduced motion, no JS particle runtime).

---

# 58. SEO DESIGN RULES

Visual UI must support:

- Clear H1
- Logical H2 hierarchy
- Readable content
- Location information
- Opening hours
- Contact details
- Game/service information

Never hide important SEO content purely for visual reasons.

---

# 59. BENGALI / ENGLISH

English and Bengali must use the same design system.

Rules:

- lang attribute must change.
- Bengali uses Noto Sans Bengali.
- Test longest Bengali strings.
- Buttons must not overflow.
- Cards must not break because of longer Bengali labels.
- Never mix Bengali and English randomly inside one label.
- IDs/prices/QR use Latin numerals.

---

# 60. LANGUAGE SWITCHER

Language switcher must be:

- Easy to discover
- Keyboard accessible
- Persistent
- Consistent across pages

Switching language must not destroy booking progress.

---

# 61. DATA DENSITY

Customer UI:

Low-to-medium density.

Admin:

Medium-to-high density.

Never make customer pages look like admin dashboards.

Never make admin pages unnecessarily spacious.

---

# 62. CUSTOMER VS ADMIN RULE

Customer UI:

Experience-first.

Admin UI:

Operation-first.

Customer:

Large visual hierarchy.

Admin:

Compact information hierarchy.

Do not blindly reuse customer components inside admin screens.

---

# 63. DESIGN CONSISTENCY RULE

If the same component appears twice:

It MUST use the same:

- Token
- Radius
- Typography
- State behavior
- Icon style
- Motion
- Spacing

Do not create:

Button A
Button B
Button C

when one approved button component can handle variants.

---

# 64. COMPONENT NAMING

Use predictable names.

Examples:

Button
Input
Modal
Toast
GameCard
StationCard
TimeSlot
BookingSummary
PricingCard
AdminTable
AnalyticsCard

Avoid:

CoolButton
FancyCard
SuperModal
MagicCard

---

# 65. AI / VIBE-CODING DESIGN RULES

AI MUST:

- Read DESIGN.md before UI work.
- Reuse existing components.
- Reuse existing tokens.
- Never invent random colors.
- Never invent random spacing.
- Never invent random font sizes.
- Never introduce a new visual style without approval.
- Never redesign unrelated pages.
- Never silently modify the design system.
- Never replace approved components with generic libraries.
- Never use emoji as icons.
- Never use arbitrary Tailwind values.
- Never introduce gradients without approval.
- Never introduce excessive animation.
- Never create "premium" effects by adding random glow.

If a design improvement requires a token change:

Mark:

DESIGN SYSTEM CHANGE REQUIRED

Do not silently implement it.

---

# 66. DESIGN CHANGE CONTROL

Any change to:

- Colors
- Typography
- Spacing
- Radius
- Shadows
- Motion
- Component architecture
- Breakpoints

requires DESIGN.md update first.

Implementation comes second.

---

# 67. NO DESIGN DRIFT

AI must not gradually change:

Purple → Blue
16px → 18px
16px → 20px
16px radius → 24px
Inter → another font

without an approved design-system change.

The latest approved DESIGN.md always wins.

---

# 68. PRODUCTION UI QUALITY BAR

A screen is NOT production-ready if:

- It looks generic.
- It uses arbitrary colors.
- It has inconsistent spacing.
- It lacks loading states.
- It lacks error states.
- It lacks empty states.
- It lacks mobile support.
- It lacks keyboard support.
- It has broken Bengali layout.
- It contains placeholder text.
- It contains fake data presented as real.
- It contains inaccessible controls.
- It uses excessive animation.

---

# 69. VISUAL QA

Before marking a UI task complete, test:

### Mobile

320px
375px
390px
430px

### Tablet

768px
1024px

### Desktop

1280px
1440px
1536px

Check:

- Layout
- Typography
- Spacing
- Overflow
- Buttons
- Forms
- Images
- Focus
- Keyboard
- Loading
- Empty
- Error
- Success
- Bengali
- Reduced motion

---

# 70. DESIGN VERIFICATION CHECKLIST

Before marking UI task complete:

- [ ] Correct colors
- [ ] Correct typography
- [ ] Correct spacing
- [ ] Correct radius
- [ ] Correct shadows
- [ ] No arbitrary values
- [ ] Correct component states
- [ ] Keyboard accessible
- [ ] Focus states visible
- [ ] WCAG AA checked
- [ ] 320px checked
- [ ] 768px checked
- [ ] 1280px checked
- [ ] Bengali checked
- [ ] Loading checked
- [ ] Empty checked
- [ ] Error checked
- [ ] Success checked
- [ ] Reduced motion checked
- [ ] No forbidden anti-patterns
- [ ] No design drift
- [ ] No fake data presented as real
- [ ] Performance impact reviewed

If ANY required item is unchecked:

NOT VERIFIED.

---

# 71. FINAL AI DESIGN CONTRACT

The AI must follow this order:

PRD
↓
ARCHITECTURE
↓
RULES
↓
DESIGN
↓
TASKS
↓
Implementation

Never:

Implementation
↓
invent design
↓
invent architecture
↓
invent requirements

The design system is a constraint, not a suggestion.

When uncertain:

DO NOT GUESS.

Use the nearest approved pattern or mark:

DESIGN DECISION REQUIRED.

Final quality target:

Premium.
Minimal.
Fast.
Accessible.
Consistent.
Professional.
Production-ready.

