# RBAC Role Matrix

## Roles

| Role     | Code       | Description                                      |
|----------|------------|--------------------------------------------------|
| Admin    | `admin`    | System administrator — full access               |
| Director | `director` | Management — reports, approvals, oversight        |
| Mentor   | `mentor`   | Counsellor — manages assigned students            |
| Student  | `student`  | End-user — views own data, submits applications   |

## Permission Matrix

| Resource / Action           | Admin | Director | Mentor | Student |
|-----------------------------|:-----:|:--------:|:------:|:-------:|
| **Auth**                    |       |          |        |         |
| Login / Logout              |  ✅   |   ✅    |  ✅   |   ✅    |
| Change own password         |  ✅   |   ✅    |  ✅   |   ✅    |
| Forgot password (OTP)       |  ✅   |   ✅    |  ✅   |   ✅    |
| **Profile**                 |       |          |        |         |
| View own profile            |  ✅   |   ✅    |  ✅   |   ✅    |
| Edit own profile            |  ✅   |   ✅    |  ✅   |   ✅    |
| **User Management**         |       |          |        |         |
| List all users              |  ✅   |   ❌    |  ❌   |   ❌    |
| Create user                 |  ✅   |   ❌    |  ❌   |   ❌    |
| Update user role            |  ✅   |   ❌    |  ❌   |   ❌    |
| Deactivate user             |  ✅   |   ❌    |  ❌   |   ❌    |
| **Dashboard**               |       |          |        |         |
| View dashboard              |  ✅   |   ✅    |  ✅   |   ✅    |
| **Students**                |       |          |        |         |
| List all students           |  ✅   |   ✅    |  ❌   |   ❌    |
| View student detail         |  ✅   |   ✅    |  ✅*  |   ❌    |
| Assign mentor               |  ✅   |   ✅    |  ❌   |   ❌    |
| **Mentors**                 |       |          |        |         |
| List all mentors            |  ✅   |   ✅    |  ❌   |   ❌    |
| View mentor detail          |  ✅   |   ✅    |  ❌   |   ✅*  |
| **My Students** (mentor)    |       |          |        |         |
| View own student list       |  ❌   |   ❌    |  ✅   |   ❌    |
| **My Mentor** (student)     |       |          |        |         |
| View assigned mentor        |  ❌   |   ❌    |  ❌   |   ✅    |
| **Applications**            |       |          |        |         |
| List all applications       |  ✅   |   ✅    |  ❌   |   ❌    |
| List own applications       |  ❌   |   ❌    |  ✅   |   ✅    |
| Create application          |  ❌   |   ❌    |  ✅   |   ✅    |
| **Universities**            |       |          |        |         |
| List universities           |  ✅   |   ✅    |  ❌   |   ❌    |
| **Approvals**               |       |          |        |         |
| List pending approvals      |  ✅   |   ✅    |  ❌   |   ❌    |
| Approve / Reject            |  ✅   |   ✅    |  ❌   |   ❌    |
| **Calendar**                |       |          |        |         |
| View calendar               |  ✅   |   ✅    |  ✅   |   ✅    |
| **Reports**                 |       |          |        |         |
| View reports                |  ✅   |   ✅    |  ❌   |   ❌    |

> *\* Mentor can only view students assigned to them. Student can only view their assigned mentor.*

## Middleware Enforcement

| Middleware Rule             | Roles                    | Laravel Middleware          |
|-----------------------------|--------------------------|-----------------------------|
| Admin only                  | `admin`                  | `role:admin`                |
| Management only             | `admin`, `director`      | `role:admin,director`       |
| Mentor scope                | `admin`, `director`, `mentor` | `role:admin,director,mentor` |
| Must change password gate   | All                      | `must_change_password`      |
