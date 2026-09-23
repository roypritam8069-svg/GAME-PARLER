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
