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
