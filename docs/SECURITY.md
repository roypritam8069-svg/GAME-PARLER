# Game Parlour — Security Requirements

## Authentication

- Secure Owner authentication
- Strong password hashing
- Secure session cookies
- Rate limiting
- Login protection
- Optional future 2FA

## Authorization

Sensitive actions require server-side authorization.

Owner-only:
- Pricing changes
- Refunds
- Customer PII access
- Exports
- Backup/restore
- Configuration

## Booking Security

- Server-side validation
- Server-side availability
- Server-side price calculation
- Double-booking protection
- Transactional booking creation

## Payment Security

Never store:
- Card number
- CVV
- Raw card details

Store only provider reference/status.

Verify payment server-side.

## PII

PII includes:
- Name
- Phone
- WhatsApp
- Email
- Booking history
- Payment references

PII must not appear in:
- Logs
- Error messages
- Analytics events
- Audit logs

Admin display should mask sensitive contact information where practical.

## Secrets

Never commit:
- API keys
- Passwords
- Payment secrets
- WhatsApp credentials
- Database passwords

Use environment variables or secret management.

## Web Security

Protect against:
- SQL injection
- XSS
- CSRF where applicable
- Broken access control
- Rate abuse
- Invalid input
- Replay/duplicate payment callbacks

## Backup Security

- Encrypt backups
- Restrict access to Owner
- Audit restore operations
- Test restore process
