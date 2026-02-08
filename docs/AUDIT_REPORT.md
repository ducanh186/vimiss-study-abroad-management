# Audit Report — Vimiss Study Abroad Management

> Generated: 2026-02-08
> Sources: `mesoco-dental-asset-management/` (reference implementation), `riba.vn/` (UI reference snapshot)

---

## 1. Mesoco — Stack & Architecture Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Laravel | 12.x |
| Auth | Laravel Sanctum (cookie-based SPA) | 4.2 |
| Frontend | React (SPA) | 19.x |
| Router (FE) | react-router-dom | 7.x |
| Build | Vite + laravel-vite-plugin | 7.x |
| CSS | Tailwind CSS v4 (@tailwindcss/vite) | 4.x |
| i18n | Custom React context (en/vi) | — |
| HTTP Client | Axios (withCredentials) | 1.x |

### Key Patterns
- **SPA architecture**: Single `spa.blade.php` serves `<div id="app">`, all routing handled by React
- **Cookie-based auth**: `axios.defaults.withCredentials = true`, CSRF via `/sanctum/csrf-cookie`
- **Service layer**: `app/Services/AuthService.php` encapsulates business logic away from controllers
- **Form requests**: Dedicated request classes for validation (e.g., `LoginRequest`, `ForgotPasswordRequest`)
- **Policies**: Model-level authorization via Laravel Policies (`AssetPolicy`, `UserPolicy`, etc.)

---

## 2. Route Map

### 2.1 Backend API Routes (api.php)

| Method | Endpoint | Controller | Auth | Roles |
|--------|----------|-----------|------|-------|
| GET | `/api/me` | AuthController@me | sanctum | all |
| POST | `/api/change-password` | AuthController@changePassword | sanctum | all |
| GET | `/api/profile` | ProfileController@show | sanctum | all |
| PUT | `/api/profile` | ProfileController@update | sanctum | all |
| GET | `/api/my-assets` | AssetController@myAssets | sanctum | all |
| GET | `/api/shifts` | ShiftController@index | sanctum | all |
| POST | `/api/checkins` | CheckinController@store | sanctum | all |
| GET | `/api/requests` | RequestController@index | sanctum | all |
| POST | `/api/requests` | RequestController@store | sanctum | all |
| GET | `/api/feedbacks` | FeedbackController@index | sanctum | all |
| POST | `/api/feedbacks` | FeedbackController@store | sanctum | all |
| **Admin only** | | | | |
| PATCH | `/api/users/{user}/role` | UserController@updateRole | sanctum | admin |
| DELETE | `/api/users/{user}` | UserController@destroy | sanctum | admin |
| CRUD | `/api/employees/{employee}/contracts` | EmployeeContractController | sanctum | admin |
| **Admin + HR** | | | | |
| CRUD | `/api/employees` | EmployeeController | sanctum | admin,hr |
| GET/POST | `/api/users` | UserController | sanctum | admin,hr |
| CRUD | `/api/assets` | AssetController | sanctum | admin,hr |
| CRUD | `/api/locations` | LocationController | sanctum | admin,hr |
| GET | `/api/reports/summary` | ReportController | sanctum | admin,hr |
| GET | `/api/inventory/*` | InventoryController | sanctum | admin,hr |
| **Admin + HR + Technician** | | | | |
| CRUD | `/api/maintenance-events` | MaintenanceEventController | sanctum | admin,hr,technician |

### 2.2 Web Routes (web.php)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/login` | Sanctum SPA login (throttle:login) |
| POST | `/logout` | Sanctum logout |
| POST | `/forgot-password/request` | Request reset code (throttle) |
| POST | `/forgot-password/reset` | Reset with code (throttle) |
| GET | `/{any}` | SPA catch-all → `spa.blade.php` |

### 2.3 Frontend Routes (app.jsx)

| Path | Component | Guard | Roles |
|------|-----------|-------|-------|
| `/login` | LoginPage | Guest | — |
| `/forgot-password` | ForgotPasswordPage | Guest | — |
| `/dashboard` | Dashboard | Protected | all |
| `/change-password` | ChangePasswordPage | Protected | all |
| `/profile` | ProfilePage | Protected | all |
| `/my-assets` | MyEquipmentPage | Protected | all |
| `/qr-scan` | QRScanPage | Protected | all |
| `/requests` | RequestsPage | Protected | all |
| `/feedback` | FeedbackPage | Protected | all |
| `/my-asset-history` | MyAssetHistoryPage | Protected | all |
| `/assets` | AssetsPage | AdminHr | admin,hr |
| `/inventory` | InventoryPage | AdminHr | admin,hr |
| `/employees` | EmployeesPage | AdminHr | admin,hr |
| `/locations` | LocationsPage | AdminHr | admin,hr |
| `/review-requests` | ReviewRequestsPage | AdminHr | admin,hr |
| `/maintenance` | MaintenancePage | AdminHr/Tech | admin,hr,technician |
| `/reports` | ReportPage | AdminHr | admin,hr |
| `/admin` | AdminPage | AdminOnly | admin |
| `/contracts` | ContractsPage | AdminOnly | admin |

---

## 3. RBAC Implementation

### 3.1 Backend — Middleware

**`CheckRole` middleware** (`app/Http/Middleware/CheckRole.php`):
- Registered as `role:` alias in kernel
- Accepts comma-separated roles: `->middleware('role:admin,hr')`
- Checks `$user->hasAnyRole($allowedRoles)`
- Returns 403 JSON with `message`, `required_roles`, `your_role`

**`CheckMustChangePassword` middleware** (`must_change_password`):
- Blocks all routes except whitelist when `user.must_change_password = true`
- Returns 409 with `error: 'MUST_CHANGE_PASSWORD'`

### 3.2 Backend — Policies

- `AssetPolicy`, `AssetCheckinPolicy`, `AssetRequestPolicy`
- `EmployeePolicy`, `UserPolicy`, `FeedbackPolicy`, `MaintenanceEventPolicy`
- Policies enforce fine-grained ownership checks (e.g., users can only edit their own feedback)

### 3.3 Frontend — Guards

- `ProtectedRoute`: redirects unauthenticated to `/login`
- `GuestRoute`: redirects authenticated to `/dashboard`
- `AdminOnlyRoute`: only `role === 'admin'`
- `AdminHrRoute`: `role === 'admin' || role === 'hr'`

### 3.4 Frontend — Sidebar

- Sidebar menu items conditionally rendered by role
- Role helpers: `isAdmin`, `isHr`, `isTechnician`, `isDoctor`, `isEmployee`
- Navigation visibility matrix documented in component JSDoc

### 3.5 User Model Roles

```php
public const ROLES = ['admin', 'hr', 'doctor', 'technician', 'employee'];
```

Role stored as string column `users.role` — no separate roles/permissions table.

---

## 4. Error Response Schema

### 4.1 Validation Errors (422)
```json
{
    "message": "The employee code field is required.",
    "errors": {
        "employee_code": ["The employee code field is required."]
    }
}
```

### 4.2 Auth Errors (401)
```json
{ "message": "Unauthenticated." }
```

### 4.3 RBAC Forbidden (403)
```json
{
    "message": "Forbidden. You do not have permission to access this resource.",
    "required_roles": ["admin"],
    "your_role": "employee"
}
```

### 4.4 Must Change Password (409)
```json
{
    "message": "Password change required.",
    "error": "MUST_CHANGE_PASSWORD",
    "must_change_password": true,
    "redirect": "/change-password"
}
```

### 4.5 Service-Layer Errors
```json
{
    "success": false,
    "error": "verification_code",
    "message": "The verification code is incorrect!"
}
```

### 4.6 FE Error Handling
`services/api.js` → `handleApiError()` switches on status codes and shows toast messages.

---

## 5. Auth Flow (Password Reset)

1. **Step 1 — Request code**: `POST /forgot-password/request` → sends 6-digit code (hashed SHA256 in DB) → 5-min TTL, 1-min resend cooldown
2. **Step 2 — Reset**: `POST /forgot-password/reset` → verifies code hash, marks used, updates password
3. **Security**: Generic "code sent" message regardless of email existence (prevents enumeration)
4. **FE**: 2-step wizard with OTP-style 6-digit input, countdown timer (60s), resend button
5. **Model**: `PasswordResetCode` with `code_hash`, `expires_at`, `used_at`, `resend_available_at`

---

## 6. Upload/Storage Pattern

- Laravel Storage (local disk by default)
- Employee contract PDF upload: `POST /api/employees/{id}/contracts` with multipart form
- File streaming: `GET /contracts/{id}/file`
- Asset images: stored in `public/images/`
- No S3/cloud storage detected in base config

---

## 7. DB Entities (Auth/Users)

### users
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | auto-increment |
| name | string | display name |
| email | string unique | for login/reset |
| password | string | hashed via cast |
| employee_code | string unique | login credential |
| employee_id | bigint FK nullable | links to employees |
| role | string | enum: admin/hr/doctor/technician/employee |
| status | string | active/inactive |
| must_change_password | boolean | forces password change |
| remember_token | string nullable | — |
| timestamps | — | created_at, updated_at |

### password_reset_codes
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | — |
| email | string indexed | — |
| code_hash | string | SHA256 of 6-digit code |
| expires_at | datetime | TTL 5 minutes |
| used_at | datetime nullable | single-use tracking |
| resend_available_at | datetime | cooldown tracking |
| last_sent_at | datetime | — |
| timestamps | — | — |

### employees
| Column | Type | Notes |
|--------|------|-------|
| id | bigint PK | — |
| employee_code | string unique | staff ID |
| full_name | string | — |
| email | string | — |
| position | string | — |
| dob | date | — |
| gender | string | — |
| phone | string | — |
| address | text | — |
| status | string | active/inactive |
| timestamps | — | — |

---

## 8. i18n Pattern

- Custom React Context (`I18nProvider`) with `useI18n()` hook
- Locales: `en.js`, `vi.js` — flat JS objects with dot-notation keys
- Storage: `localStorage` key `mesoco_language`, default `vi`
- Translation function: `t('auth.forgotPassword', { params })` with interpolation
- Language switcher component in topbar

---

## 9. UI Component Library

Located in `resources/js/components/ui/`:

| Component | Description |
|-----------|-------------|
| Button | Variants: primary, secondary, outline, ghost, danger. Sizes: sm/md/lg |
| Input | Label, error, helper text, left/right icons, sizes |
| Textarea | Extends Input pattern |
| Select | Native select with same styling |
| Badge | Status badges with color variants |
| Card | Container with header/body/footer |
| Modal | Overlay dialog with close, title, actions |
| Table | Sortable table with pagination |
| Toast | Toast notifications (success/error/info) |
| LoadingSpinner | Animated spinner |
| LanguageSwitcher | en/vi toggle |

---

## 10. Riba.vn UI Reference Summary

### Layout Structure
- **Header**: Fixed top bar with logo (left), horizontal mega-menu (center), social icons (right)
- **Hero**: Full-width dark section (#0F0F0F) with large heading, subtitle, info cards grid
- **Content**: Alternating light/dark sections for visual rhythm
- **Footer**: Dark, with social bar, address, copyright

### Color Scheme (for Vimiss adaptation)
| Role | Riba Color | Vimiss Adaptation |
|------|-----------|------------------|
| Primary | Purple #5719A8 | → Blue/Navy (education tone) |
| CTA | Coral gradient #FF0766→#FF7E5D | → Brand accent (TBD) |
| Dark BG | #0F0F0F, #0B163F | → Deep navy or dark blue |
| Light BG | #F8F9FA, #FFFFFF | → Keep as-is |
| Accent | Cyan #28E5F6 | → Teal/sky blue |

### Key Page Patterns to Rebuild
1. **Login page**: Centered card on gradient/dark background, logo above, form with validation
2. **Dashboard shell**: Sidebar + topbar layout (from mesoco pattern, adapted with riba color scheme)
3. **Data tables**: Filterable, sortable lists for applications/students/mentors
4. **Forms**: Multi-section forms for profiles, inline validation with focus management
5. **Cards**: Status cards for application tracking, document validation labels

### Typography
- Primary: Inter (from mesoco) — clean, professional, great for admin UI
- Headings: Bold weights, navy/dark text
- Body: Regular weight, gray-700 text

---

## 11. Assumptions

Documented in `docs/ASSUMPTIONS.md`.
