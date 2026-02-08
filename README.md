# Vimiss Study Abroad Management

> Internal management system for the Vimiss study-abroad consultancy. Manages students, mentors, university applications, documents, and approval workflows.

## Tech Stack

| Layer     | Technology                      |
|-----------|---------------------------------|
| Backend   | Laravel 12.x + Sanctum 4.2     |
| Frontend  | React 19.x SPA + Tailwind v4   |
| Build     | Vite 7.x                       |
| Database  | SQLite (dev) / MySQL (prod)     |
| Auth      | Sanctum cookie-based SPA auth   |
| i18n      | Custom React Context (vi/en)    |

## Quick Start

```bash
# Clone
git clone <repo-url>
cd vimiss-study-abroad-management

# Backend deps
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed

# Frontend deps
npm install
npm run dev

# Serve
php artisan serve
# Open http://localhost:8000
```

## Demo Accounts

| Email                   | Password | Role     |
|-------------------------|----------|----------|
| admin@vimiss.vn         | password | Admin    |
| director@vimiss.vn      | password | Director |
| mentor1@vimiss.vn       | password | Mentor   |
| mentor2@vimiss.vn       | password | Mentor   |
| student1@vimiss.vn      | password | Student  |
| student2@vimiss.vn      | password | Student  |
| student3@vimiss.vn      | password | Student  |

## Project Structure

```
├── app/
│   ├── Http/Controllers/   # AuthController, UserController, ProfileController
│   ├── Http/Middleware/     # CheckRole, CheckMustChangePassword
│   ├── Http/Requests/       # Form request validation
│   ├── Models/              # User, PasswordResetCode
│   ├── Policies/            # UserPolicy (admin-only CRUD)
│   ├── Providers/           # AppServiceProvider (rate limiters)
│   └── Services/            # AuthService (password reset logic)
├── resources/
│   ├── css/app.css          # Full design system (CSS custom properties)
│   ├── js/
│   │   ├── app.jsx          # Main SPA — AuthContext, routing, pages
│   │   ├── i18n/            # I18nProvider, vi/en locales
│   │   └── services/api.js  # API helpers with error handling
│   └── views/spa.blade.php  # Blade catch-all
├── routes/
│   ├── web.php              # Auth routes + SPA catch-all
│   └── api.php              # API routes (Sanctum-protected)
├── database/
│   ├── migrations/          # users, password_reset_codes, sessions, etc.
│   └── seeders/             # Demo accounts
└── docs/                    # AUDIT_REPORT.md, PLAN.md, etc.
```

## RBAC Roles

| Role     | Capabilities                                         |
|----------|------------------------------------------------------|
| Admin    | Full access — user CRUD, all modules, settings       |
| Director | View reports, approve docs, manage mentors/students  |
| Mentor   | View assigned students, manage applications          |
| Student  | View own mentor, submit applications, upload docs    |

## Phases

- **Phase 0** ✅ Audit + Plan
- **Phase 1** ✅ Scaffolding + Config
- **Phase 2** ✅ Auth + Layout + RBAC skeleton
- **Phase 3** 🔲 Profiles + Assignment (student-mentor)
- **Phase 4** 🔲 Applications + Documents
- **Phase 5** 🔲 Approvals + Calendar

## License

Proprietary — Vimiss internal use only.
