# Migration Plan — Vimiss Study Abroad Management

> Generated: 2026-02-08
> Based on: AUDIT_REPORT.md findings

---

## 1. Overview

Transform the mesoco-dental-asset-management architecture into a **study abroad management platform** (Vimiss) while:
- Keeping the proven auth/RBAC/i18n/UI patterns
- Replacing all dental/asset domain logic with study-abroad domain
- Adapting the visual style inspired by riba.vn (color scheme, layout feel)

---

## 2. What to Reuse from Mesoco (Copy & Adapt)

### 2.1 Boilerplate (copy as-is, rename config)
- `composer.json` → update name, description
- `package.json` → update name, keep same deps
- `vite.config.js` → identical
- `spa.blade.php` → update title
- `.env.example` → update app name
- `bootstrap/app.php`, `bootstrap/providers.php`
- `config/` → entire folder (update `app.name`)

### 2.2 Auth System (copy & adapt)
- `AuthController.php` → change login field from `employee_code` to `email`
- `AuthService.php` → reuse entirely (password reset with code)
- `PasswordResetCode` model → reuse entirely
- `LoginRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `ChangePasswordRequest` → adapt login field
- `CheckRole` middleware → reuse (change role constants)
- `CheckMustChangePassword` middleware → reuse entirely

### 2.3 Frontend Patterns (copy & adapt)
- `app.jsx` → AuthContext, ProtectedRoute, GuestRoute → adapt role guards
- `services/api.js` → reuse error handler, create new domain APIs
- `i18n/` → reuse pattern, new translation keys
- `components/ui/` → reuse all UI components
- `layouts/` → reuse AdminLayout, Sidebar, Topbar, Breadcrumbs → new menu items

### 2.4 CSS Framework
- Tailwind CSS v4 with same configuration
- Custom CSS classes (`.auth-layout`, `.admin-layout`, etc.) → adapt colors

---

## 3. What to Remove (Not Needed)

- All asset/equipment models, controllers, migrations, pages
- QR scanner functionality
- Shift/check-in system
- Inventory/valuation system
- Maintenance events
- Employee/contract models (replaced by mentor/student profiles)

---

## 4. New Domain Mapping

| Mesoco Concept | → | Vimiss Concept |
|---------------|---|----------------|
| Employee | → | Mentor / Student (separate models) |
| Asset | → | Application (hồ sơ du học) |
| AssetAssignment | → | MentorAssignment |
| Request | → | ScholarshipRequest |
| RequestItem | → | ApplicationDocument |
| Maintenance | → | DocumentValidation |
| Feedback | → | StudentFeedback |
| Location | → | University |
| Shift | → | CalendarEvent |
| Role: admin | → | Role: admin |
| Role: hr | → | Role: director |
| Role: doctor | → | Role: mentor |
| Role: technician | → | (removed) |
| Role: employee | → | Role: student |

---

## 5. Implementation Phases

### Phase 1 — Project Scaffolding (estimated: 1 session)

**Tasks:**
1. Create new Laravel project in `./vimiss-study-abroad-management`
2. Copy minimal boilerplate from mesoco
3. Initialize git
4. Create docs/ with:
   - VISION.md
   - ROLE_MATRIX.md
   - ROUTES_FE.md + ROUTES_BE.md
   - DB_SCHEMA.md
   - MVP_SCOPE.md
5. Create `.env.example`
6. Create README.md with setup steps

**Deliverables:** Empty but runnable Laravel + React project

### Phase 2 — Auth + Layout + RBAC Skeleton (estimated: 1-2 sessions)

**Tasks:**
1. Database migrations:
   - `users` table (email login, role enum: admin/director/mentor/student)
   - `password_reset_codes` table
2. Backend:
   - AuthController (login/logout/forgot/reset/change-password)
   - AuthService (password reset logic)
   - CheckRole middleware (4 roles)
   - CheckMustChangePassword middleware
   - User model with role helpers
3. Frontend:
   - Login page (riba.vn inspired style — dark bg, centered card)
   - Forgot password 2-step page
   - Change password page
   - AdminLayout with sidebar + topbar
   - Sidebar with role-based menu items
   - Auth guards (ProtectedRoute, GuestRoute, role-based routes)
   - i18n setup (vi/en)
4. Seeder: demo accounts for all 4 roles

**Acceptance criteria:**
- ✅ Login/logout works end-to-end
- ✅ Forgot password with 6-digit code, 5-min expiry, 60s resend cooldown
- ✅ Change password with current password validation
- ✅ Sidebar shows correct menus per role
- ✅ BE returns 403 for unauthorized role access

### Phase 3 — Mentor/Student Profiles + Assignment (estimated: 1-2 sessions)

**Tasks:**
1. Migrations:
   - `mentors` table (user_id, staff_code, specialty, phone, max_students)
   - `students` table (user_id, personal info, HSK level, passport status, etc.)
   - `mentor_assignments` table (mentor_id, student_id, assigned_at, status)
2. Backend:
   - MentorController CRUD
   - StudentController CRUD
   - MentorAssignmentController (assign/unassign)
   - Policies for ownership checks
3. Frontend:
   - Mentor list/detail pages (admin)
   - Student list/detail pages (mentor/admin)
   - Student profile edit (student — limited fields)
   - "My Students" page (mentor)
   - "My Mentor" section (student)
   - Assign mentor flow (choose or random)

### Phase 4 — Application Tracking + Documents (estimated: 1-2 sessions)

**Tasks:**
1. Migrations:
   - `applications` table (student_id, mentor_id, university_id, scholarship_type, status, etc.)
   - `application_documents` table (application_id, type, file_path, validation_status, etc.)
   - `universities` table (name, code, quotas, deadlines)
   - `document_status_logs` table (document_id, old_status, new_status, changed_by, etc.)
2. Backend:
   - ApplicationController CRUD
   - DocumentController (upload, validate, status change)
   - UniversityController CRUD
   - ScholarshipRequest logic with HSK/GPA warnings
3. Frontend:
   - My Applications list
   - Application detail with document upload
   - Document validation labels + history
   - Scholarship request form with warnings

### Phase 5 — Approvals + Calendar + Auto-close (estimated: 1-2 sessions)

**Tasks:**
1. Migrations:
   - `approval_flows` table
   - `calendar_events` table
2. Backend:
   - ApprovalController
   - CalendarController
   - Scheduled command for deadline auto-close
3. Frontend:
   - Approval queue page (director/admin)
   - Calendar view (list + create)
   - Expired status indicators

---

## 6. DB Schema Overview (Phase 2 Focus)

### users
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'director', 'mentor', 'student') DEFAULT 'student',
    status ENUM('active', 'inactive') DEFAULT 'active',
    must_change_password BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### password_reset_codes
```sql
CREATE TABLE password_reset_codes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL INDEX,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    resend_available_at TIMESTAMP NULL,
    last_sent_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

---

## 7. RBAC Matrix (Phase 2)

| Permission | admin | director | mentor | student |
|-----------|-------|----------|--------|---------|
| Login/Logout | ✅ | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ | ✅ (limited) |
| Manage users (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ | ❌ |
| View all mentors | ✅ | ✅ | ❌ | ❌ |
| CRUD mentor profiles | ✅ | ❌ | ❌ | ❌ |
| View assigned students | ✅ | ✅ | ✅ (own) | ❌ |
| CRUD student profiles | ✅ | ❌ | ✅ (assigned) | ✅ (self, limited) |
| Assign mentor | ✅ | ✅ | ❌ | ✅ (choose) |
| View all applications | ✅ | ✅ | ❌ | ❌ |
| Manage applications | ✅ | ❌ | ✅ (assigned) | ✅ (own) |
| Upload documents | ✅ | ❌ | ✅ | ✅ |
| Validate documents | ✅ | ❌ | ✅ | ❌ |
| Approve special items | ✅ | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ❌ | ❌ |
| Manage universities | ✅ | ✅ | ❌ | ❌ |
| Calendar CRUD | ✅ | ✅ | ✅ | ✅ (view only) |

---

## 8. Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Scope creep | MVP_SCOPE.md defines clear boundaries |
| RBAC gaps | Backend middleware + policies enforced; FE guards are convenience only |
| Secret leaks | `.env.example` with placeholders only; `.gitignore` for `.env` |
| IDOR attacks | Policies check ownership; never trust FE-sent IDs blindly |
| Password enumeration | Generic messages for forgot-password flow |
| File upload abuse | Validate MIME types, size limits, scan paths |

---

## 9. Naming Conventions (from Mesoco)

| Item | Convention | Example |
|------|-----------|---------|
| Migration | `YYYY_MM_DD_HHMMSS_verb_noun_table.php` | `2026_02_08_create_students_table.php` |
| Model | Singular PascalCase | `Student`, `MentorAssignment` |
| Controller | ResourceController | `StudentController` |
| Request | VerbNounRequest | `StoreStudentRequest` |
| Policy | ModelPolicy | `StudentPolicy` |
| FE Page | PascalCasePage.jsx | `StudentsPage.jsx` |
| i18n key | `section.key` | `auth.login`, `student.profile` |
| API endpoint | `/api/resource` RESTful | `GET /api/students` |
| Commit | `type(scope): message` | `feat(auth): add login endpoint` |

---

## 10. Next Step

**Proceed to Phase 1**: Create project structure and documentation files.
Then **Phase 2**: Implement Auth + Layout + RBAC skeleton.
