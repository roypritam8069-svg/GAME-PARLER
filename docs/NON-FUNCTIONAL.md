# Game Parlour — Non-Functional Requirements

## Performance

- Fast initial page load
- Optimized images
- Minimal client JavaScript where possible
- Lazy-load non-critical content
- Avoid unnecessary dependencies

## Reliability

- Booking failures must not create false confirmations.
- Payment failures must be recoverable.
- Notification failures must not invalidate confirmed bookings.
- Backup failures must be detectable.

## Availability

System should remain usable during normal parlour operating hours.

## Scalability

Initial target:
- Single location
- Small/medium customer volume
- 1 Owner/Admin

Architecture should allow future expansion without rewriting the booking core.

## Accessibility

- Keyboard navigation
- Semantic HTML
- Visible focus
- Accessible forms
- Adequate contrast
- Reduced motion support

## Maintainability

- TypeScript
- Modular services
- Clear naming
- Tests for critical business logic
- Database migrations
- Documentation

## Observability

Monitor:
- Booking errors
- Payment failures
- Notification failures
- Database errors
- Backup failures

Logs must not contain PII.

## Testing

Critical areas require:
- Unit tests
- Integration tests
- End-to-end tests

Critical booking/payment logic must be tested before production.

## Browser Support

Support current major:
- Chrome
- Edge
- Firefox
- Safari
- Mobile browsers
