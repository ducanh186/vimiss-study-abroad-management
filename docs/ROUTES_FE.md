# Frontend Routes

| Path                       | Component          | Guard           | Phase |
|----------------------------|--------------------|-----------------|-------|
| `/`                        | LandingPage        | (public)        | 2     |
| `/auth/login`              | LoginPage          | GuestRoute      | 2     |
| `/auth/register`           | RegisterPage       | GuestRoute      | 2     |
| `/auth/forgot-password`    | ForgotPasswordPage | GuestRoute      | 2     |
| `/dashboard`               | DashboardPage      | ProtectedRoute  | 2     |
| `/settings/change-password`| ChangePasswordPage | ProtectedRoute  | 2     |
| `/profile`                 | ProfilePage        | ProtectedRoute  | 2     |
| `/users`                   | UsersPage          | RoleRoute(admin)| 2     |
| `/login`                   | → redirect `/auth/login` | —        | 2     |
| `/forgot-password`         | → redirect `/auth/forgot-password` | — | 2 |
| `/change-password`         | → redirect `/settings/change-password` | — | 2 |
| `/calendar`                | CalendarPage       | ProtectedRoute  | 5     |
| `/my-mentor`               | MyMentorPage       | RoleRoute(student) | 3  |
| `/my-applications`         | MyApplicationsPage | RoleRoute(student,mentor) | 4 |
| `/my-students`             | MyStudentsPage     | RoleRoute(mentor)  | 3  |
| `/students`                | StudentsPage       | RoleRoute(admin,director) | 3 |
| `/mentors`                 | MentorsPage        | RoleRoute(admin,director) | 3 |
| `/applications`            | ApplicationsPage   | RoleRoute(admin,director) | 4 |
| `/universities`            | UniversitiesPage   | RoleRoute(admin,director) | 4 |
| `/approvals`               | ApprovalsPage      | RoleRoute(admin,director) | 5 |
| `/reports`                 | ReportsPage        | RoleRoute(admin,director) | 5 |
| `*`                        | → redirect `/`     | —               | 2     |
