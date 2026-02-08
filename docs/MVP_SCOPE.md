# MVP Scope

## In Scope (Phase 2 — Current)

### Auth
- [x] Email + password login (Sanctum cookie auth)
- [x] Logout
- [x] Forgot password — 2-step OTP flow (request code → verify & reset)
- [x] Change password (force on first login when flag set)
- [x] Session-based auth with CSRF protection

### Layout
- [x] Admin layout — sidebar, topbar, content area
- [x] Responsive sidebar (collapsible, mobile hamburger)
- [x] Language switcher (VI / EN) — persisted to localStorage
- [x] Role-based sidebar navigation
- [x] Toast notifications

### RBAC
- [x] 4 roles: admin, director, mentor, student
- [x] Middleware enforcement (CheckRole)
- [x] Frontend route guards (ProtectedRoute, GuestRoute, RoleRoute)
- [x] UserPolicy for admin-only user management

### User Management (Admin)
- [x] List users with role badges and status
- [x] Create user modal (name, email, password, role)
- [x] Pagination ready

### Profile
- [x] View own profile
- [x] Edit name

### Dashboard
- [x] Role-aware welcome message
- [x] Stat cards (placeholder values — will be wired in Phase 3+)

## Out of Scope (Future Phases)

### Phase 3 — Profiles + Assignment
- Extended student/mentor profiles
- Mentor-student assignment CRUD
- My Students / My Mentor pages

### Phase 4 — Applications + Documents
- Application lifecycle (create, edit, submit, review)
- Document upload/download/version
- University catalog

### Phase 5 — Approvals + Calendar
- Approval workflows with audit trail
- Calendar events (deadlines, visa dates, interviews)
- Reports and analytics

## Assumptions

See [ASSUMPTIONS.md](./ASSUMPTIONS.md).
