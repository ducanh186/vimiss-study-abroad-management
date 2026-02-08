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

### Option 1: Using Menu Script (Recommended)

```bash
# Interactive menu with all options
vimiss.bat

# Then select:
# [7] DEMO - Full setup + start servers (one command)
# or [1] SETUP then [2] DEV
```

### Option 2: Manual Setup

```bash
# Backend
composer install
cp .env.example .env
php artisan key:generate
type nul > database\database.sqlite
php artisan migrate --seed

# Frontend
npm install

# Run servers (in separate terminals)
php artisan serve    # http://localhost:8000
npx vite            # http://localhost:5173
```

The `vimiss.bat` script provides an interactive menu with all development tasks.

## Menu Options

| Option | Description |
|--------|-------------|
| **[1] SETUP** | First time setup - install dependencies, create .env, migrate, seed |
| **[2] DEV** | Start development servers (Laravel + Vite) |
| **[3] FRESH** | Reset database (drop all + migrate + seed) |
| **[4] BUILD** | Build production assets |
| **[5] TEST** | Run PHPUnit tests |
| **[6] CLEAN** | Clear all caches and logs |
| **[7] DEMO** | Full setup + start servers (recommended for first run) |
| **[8] EXIT** | Exit |

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
