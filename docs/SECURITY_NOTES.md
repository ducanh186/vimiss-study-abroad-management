# Security Notes — Phase 2

## Verification Code Handling

### Code Generation & Storage
- Codes are 6-digit numeric strings (000000–999999)
- Generated via `random_int()` (cryptographically secure)
- Stored as **SHA-256 hash** in `verification_codes.code_hash` — plain codes are never persisted
- Plain code is logged only when `APP_ENV=local` (for dev convenience); redacted in all other environments

### Code Lifecycle
- **Expiry**: 5 minutes from creation (`expires_at`)
- **Single-use**: marked via `consumed_at` timestamp after successful verification
- **Previous codes invalidated** when a new code is requested for the same email + purpose
- **Attempts tracked**: `attempts_count` column incremented on each verification try

### Resend Cooldown
- **60 seconds** between code requests for the same email + purpose
- Tracked via `resend_available_at` column
- Frontend enforces countdown timer; backend enforces via model check

## Rate Limiting

All rate limiters defined in `AppServiceProvider::configureRateLimiting()`.

| Endpoint | Rate Limiter Key | Limits |
|----------|-----------------|--------|
| `POST /login` | `login` | 5/min per IP+email combo |
| `POST /register/request-code` | `register-request-code` | 3/min per IP + 1/min per email |
| `POST /register` | `register` | 5/min per IP |
| `POST /forgot-password/request` | `forgot-password-request` | 3/min per IP + 1/min per email |
| `POST /forgot-password/reset` | `forgot-password-reset` | 5/min per IP + 5/min per email |

Rate limit responses return HTTP 429 with `Retry-After` header.

## Audit Logging

Security events are recorded in the `audit_logs` table:

| Event | When |
|-------|------|
| `login` | Successful login |
| `logout` | User logout |
| `register_code_requested` | Registration code sent |
| `user_registered` | Student account created |
| `password_reset_code_requested` | Password reset code sent |
| `password_reset_completed` | Password successfully reset |
| `password_changed` | User changed password (authenticated) |

Each log entry includes: user_id (if known), email, IP address, timestamp, and optional metadata.

## Authentication

- **Sanctum cookie-based SPA authentication** (stateful sessions)
- CSRF protection on all web routes except explicitly exempted auth endpoints
- Session regenerated on login; invalidated on logout
- All API tokens deleted on logout
- `must_change_password` middleware forces password change before accessing protected routes

## Registration Rules

- Only **student** role can self-register
- Mentor, admin, director accounts are created by admin or via seeder
- Registration requires a valid, non-expired, non-consumed verification code
- Email uniqueness enforced at DB level

## Password Policy

- Minimum 8 characters (validated in form requests)
- Passwords hashed via Laravel's `hashed` cast (bcrypt, rounds=12 default; rounds=4 in testing)
- Password confirmation required for register, reset, and change flows

## Information Disclosure Prevention

- Code request endpoints always return a generic success message regardless of whether the email exists
- This prevents email enumeration attacks
- Actual code sending only occurs for valid, non-duplicate emails
