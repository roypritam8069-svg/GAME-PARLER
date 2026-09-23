# Game Parlour — Development Rules

## 1. Core Rules

- Follow PRD.md
- Follow ARCHITECTURE.md
- Follow DESIGN.md
- Follow SECURITY.md
- Follow TASKS.md
- Never silently change requirements
- Never invent business rules

## 2. AI / Vibe Coding Rules

- Read PRD, ARCHITECTURE, RULES, DESIGN and TASKS before coding.
- Work only on the current TASKS.md item.
- Never silently expand scope.
- Never invent files, functions, packages or test results.
- One task per change.
- Do not bundle unrelated features.
- Do not refactor unrelated files.
- Do not rename existing files/functions/routes without approval.
- Do not add dependencies without approval.
- Do not change the stack without approval.
- Do not change DB schema without a migration.
- Do not generate fake/placeholder logic that pretends to work.
- After every change state:
  - Changed
  - Tested
  - NOT TESTED
- Anything unverified must be marked NOT VERIFIED.

## 3. Database

- PostgreSQL is production database.
- Prisma is ORM.
- Every schema change requires migration.
- Never modify production DB manually.
- Never delete production data without explicit authorization.

## 4. Booking

- Server is authoritative.
- Never trust client price.
- Never trust client availability.
- Prevent double booking.
- Preserve confirmed booking price.
- Every confirmed booking needs unique Booking ID.

## 5. Payment

- Never store card data.
- Verify payment server-side.
- Store provider reference and status only.

## 6. Privacy

- Collect minimum PII.
- Do not expose PII in logs.
- Mask phone/email in admin where appropriate.
- PII access requires server authorization.
- Exports must be protected.
- Backups containing PII must be encrypted.

## 7. WhatsApp

- Transactional notifications require appropriate opt-in.
- Marketing consent must be separate.
- Never send marketing without consent.

## 8. UI

- Follow DESIGN.md exactly.
- Do not randomly change colors.
- Do not randomly change typography.
- Avoid excessive animations.
- Mobile-first.
- Accessible controls.

## 9. Development

- Prefer simple maintainable code.
- Reuse existing components.
- Avoid unnecessary dependencies.
- No dead code.
- No fake API responses in production.
- No hard-coded secrets.

## 10. Approval

No Phase 1+ implementation may begin before Phase 0 approval is complete.
