# Database Schema (Phase 2 — Auth Skeleton)

## users

| Column               | Type        | Notes                                  |
|----------------------|-------------|----------------------------------------|
| id                   | bigint PK   | auto-increment                         |
| name                 | varchar     |                                        |
| email                | varchar     | unique                                 |
| email_verified_at    | timestamp   | nullable                               |
| password             | varchar     |                                        |
| role                 | enum        | admin, director, mentor, student       |
| status               | enum        | active, inactive — default active      |
| must_change_password | boolean     | default false                          |
| remember_token       | varchar(100)| nullable                               |
| created_at           | timestamp   |                                        |
| updated_at           | timestamp   |                                        |

## password_reset_codes

| Column              | Type        | Notes                                  |
|---------------------|-------------|----------------------------------------|
| id                  | bigint PK   | auto-increment                         |
| email               | varchar     | indexed                                |
| code_hash           | varchar     | bcrypt hash of 6-digit code            |
| expires_at          | timestamp   |                                        |
| resend_available_at | timestamp   |                                        |
| used_at             | timestamp   | nullable                               |
| created_at          | timestamp   |                                        |
| updated_at          | timestamp   |                                        |

## sessions

| Column       | Type        | Notes             |
|--------------|-------------|-------------------|
| id           | varchar PK  |                   |
| user_id      | bigint FK   | nullable, indexed |
| ip_address   | varchar(45) | nullable          |
| user_agent   | text        | nullable          |
| payload      | longtext    |                   |
| last_activity| int         | indexed           |

## personal_access_tokens

Standard Sanctum table — `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`.

## cache / cache_locks

Standard Laravel cache tables.

## jobs / job_batches / failed_jobs

Standard Laravel queue tables (for future use).

---

### Future Tables (Phase 3–5)

- `mentor_student` — pivot table for assignment
- `universities` — name, country, ranking, programs
- `applications` — student_id, university_id, status, documents
- `documents` — file attachments per application
- `approvals` — approval_type, approvable_id, status, approved_by
- `calendar_events` — title, date, type (deadline/visa/interview)
