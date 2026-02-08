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

### Setup

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

### Development Commands

```bash
# Reset database
php artisan migrate:fresh --seed

# Build production assets
npm run build

# Run tests
php artisan test

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
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
│   ├── Models/              # User, VerificationCode, AuditLog, MentorProfile
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

### Role Overview

| Role     | Code       | Description                                      |
|----------|------------|--------------------------------------------------|
| **Admin**    | `admin`    | System administrator with full access            |
| **Director** | `director` | Management with oversight and approval authority |
| **Mentor**   | `mentor`   | Counsellor managing assigned students            |
| **Student**  | `student`  | End-user with access to own data                 |

### Detailed Capabilities

#### Admin
- Full system access and configuration
- User CRUD: create, update roles, deactivate users
- Access all modules and settings
- View all students, mentors, and applications
- System-wide reports and analytics

#### Director
- Management oversight and reporting
- View all students and mentors
- Generate and view system reports
- Approve/reject documents and applications
- Assign mentors to students
- Manage pending approvals

#### Mentor
- View and manage assigned students only
- Access own student list
- View and manage applications of assigned students
- Update student progress and notes
- Access calendar for scheduling
- Update own profile

#### Student
- View own profile and data
- View assigned mentor information
- View and submit own applications
- Upload required documents
- Access calendar for deadlines
- Update own profile

### Permission Highlights

- **Authentication**: All roles can login, logout, change password, and use forgot password (OTP)
- **Profile Management**: All users can view and edit their own profile
- **User Management**: Only Admin can create, update roles, and deactivate users
- **Student-Mentor Assignment**: Only Admin and Director can assign mentors to students
- **Approvals**: Only Admin and Director can approve/reject documents and applications
- **Reports**: Only Admin and Director have access to system reports
- **Scope Restrictions**: 
  - Mentors can only access students assigned to them
  - Students can only view their assigned mentor and their own data

## Phases

- **Phase 0** ✅ Audit + Plan
- **Phase 1** ✅ Scaffolding + Config
- **Phase 2** ✅ Auth + Public Landing + i18n + Registration + Forgot/Reset Password
- **Phase 3** 🔲 Profiles + Assignment (student-mentor)
- **Phase 4** 🔲 Applications + Documents
- **Phase 5** 🔲 Approvals + Calendar

## Mail Setup (Development)

The default mail driver is `log`. Verification codes are logged to `storage/logs/laravel.log`.

To use Mailpit for a local SMTP inbox:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

Then open http://localhost:8025 for the Mailpit web UI.

## Environment Variables

Key `.env` values:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_CONNECTION` | `sqlite` | Database driver |
| `MAIL_MAILER` | `log` | Mail driver (log, smtp, mailpit) |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:8000,localhost:5173` | SPA domains for cookie auth |
| `APP_ENV` | `local` | Environment (local shows codes in logs) |

## License

Proprietary — Vimiss internal use only.
