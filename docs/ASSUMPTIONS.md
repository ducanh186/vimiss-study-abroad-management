# Assumptions

1. **Single-tenant deployment** — one Vimiss instance, not multi-tenant.
2. **SQLite for development** — production will use MySQL/PostgreSQL.
3. **No email sending in dev** — OTP codes are logged to `storage/logs/laravel.log` for testing.
4. **Admin creates all accounts** — no self-registration. Students and mentors are added by admin.
5. **Cookie-based auth only** — no API tokens; SPA uses Sanctum cookies + CSRF.
6. **Password reset via OTP** — 6-digit code, 5-minute expiry, 1-minute resend cooldown.
7. **must_change_password flag** — when admin creates a user with a temporary password, the flag is set. User must change before accessing other routes.
8. **Soft deactivation** — deleting a user sets `status = 'inactive'`; record is not physically deleted.
9. **Vietnamese-first locale** — default language is `vi`; user can switch to `en` at any time.
10. **Roles are static** — the four roles (admin, director, mentor, student) are hardcoded. No dynamic role or permission management in Phase 2.
11. **No file uploads in Phase 2** — document management comes in Phase 4.
12. **riba.vn UI serves as visual reference only** — we do not use WordPress code; we merely replicate the colour palette and layout patterns in our custom CSS.
13. **mesoco architecture is the blueprint** — we follow its patterns for controllers, services, middleware, i18n, and React SPA structure, adapting for the study-abroad domain.
