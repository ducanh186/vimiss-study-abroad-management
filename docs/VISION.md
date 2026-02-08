# Vision — Vimiss Study Abroad Management

## Problem
Vimiss study-abroad consultancy manages hundreds of students, mentors, university applications, and documents manually via spreadsheets and chat. This causes:
- Lost documents and duplicate submissions
- No clear visibility on application status
- Mentor-student assignments tracked informally
- Approval bottlenecks with no audit trail

## Solution
A web-based management platform providing:
1. **Centralised student & mentor profiles** with assignment tracking
2. **Application lifecycle management** — create, track, approve/reject
3. **Document vault** — upload, version, and organise per student
4. **Approval workflows** — director/admin sign-off with timestamps
5. **Calendar & deadlines** — track university deadlines, visa dates
6. **Reports & dashboards** — real-time stats for management

## Guiding Principles
- **Vietnamese-first UI** with English toggle
- **Role-based access** — four distinct roles with clear permission boundaries
- **Offline-ready UX** — graceful degradation, optimistic updates where safe
- **Mobile-friendly** — responsive sidebar + topbar layout
- **Familiar patterns** — reuse mesoco architecture so team ramps up fast

## Success Criteria (MVP)
- Admin can create/manage users and assign roles
- Director can view dashboards and approve documents
- Mentors see their assigned students and manage applications
- Students can view their mentor, submit applications, and upload documents
- Forgot-password flow works end-to-end with 6-digit OTP
- All pages available in Vietnamese and English
