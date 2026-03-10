# YH School Management System -- Implementation Plan

## Overview

Management system for a Swedish yrkeshogskola (YH) education provider (utbildningsanordnare). Handles programs, cohorts, students, courses, grading, LIA placements, and regulatory compliance with MYH and CSN.

Built incrementally -- each phase adds a coherent set of features with complete backend + frontend coverage. Domain research documented in `yh_analysis.md`.

**Stack:** FastAPI + SQLAlchemy 2.0 + PostgreSQL (backend), React 18 + Vite 6 + Zustand + Tailwind CSS 4 (frontend).

---

## Phase 1: Foundation (COMPLETE)

### What Was Built

**Role system:**
- Database-backed `Role` model (id, name, description) -- not a Python enum (per backend-api.md rule #1)
- User has `role_id` FK to roles table. `User.role` is a `@property` returning `role_ref.name`
- Three default roles seeded: admin, utbildningsledare, student
- `require_role(*allowed_roles: str)` guard factory in `security.py`
- Convenience guards: `get_current_admin = require_role("admin")`, `get_current_staff = require_role("admin", "utbildningsledare")`

**User management:**
- Admin-only user listing with `?role=` query filter
- User detail, role change (`PUT /user/{id}/role` with `UserRoleUpdateSchema` containing `role_id: int`)
- Public registration removed from backend
- `AdminUserCreateSchema` (email, first_name, last_name, password, `role_id: int`) and `create_user_as_admin` service exist but are not exposed via API endpoint -- users created via seed scripts only

**Programs:**
- Full CRUD. Fields: name, code (unique), description, yh_points (default 400), duration_weeks (default 80), status (draft/active/completed/archived), leader_id FK
- Leader assignment validates user is utbildningsledare
- All authenticated users can browse; admin-only for create/update/delete

**Courses:**
- Nested under programs. Fields: name, code (unique), description, yh_points (default 20), sort_order (default 0), program_id FK
- Composite index on (program_id, sort_order)
- Staff (admin + utbildningsledare) can create/update; admin-only for delete

**Seed scripts:**
- `backend/scripts/seed_db.py` -- seeds roles + interactive admin user creation
- `backend/scripts/seed_data.py` -- seeds sample programs, courses, and users

**Frontend:**
- ProgramsPage, ProgramDetailPage, ProgramFormPage, CourseFormPage
- RoleBadge, StatusBadge, RoleGuard components
- Role-based sidebar navigation (admin sees Users + Programs; utbildningsledare sees Programs; student browses Programs)
- authStore uses `role` string from UserOutSchema

### Key Files

| File | Contents |
|------|----------|
| `backend/app/api/v1/core/models.py` | Role, User, Token, Program, Course |
| `backend/app/api/v1/core/schemas.py` | All Pydantic schemas (create/update/out) |
| `backend/app/api/v1/core/services.py` | Business logic for roles, users, programs, courses |
| `backend/app/security.py` | Auth guards, token management, password hashing |
| `backend/app/api/v1/core/endpoints/programs.py` | Programs + courses endpoints |
| `backend/app/api/v1/core/endpoints/general.py` | User management + profile endpoints |
| `backend/app/api/v1/core/endpoints/authentication.py` | Login, me, logout |
| `backend/app/api/v1/routers.py` | Route registration (auth, general, programs, courses) |

### Known Gaps Carried Forward

- ~~`RegisterPage.jsx` + `RegisterForm.jsx` still exist in frontend~~ -- resolved in Phase 2 (files already absent)
- ~~No admin user creation API endpoint~~ -- resolved in Phase 2 (`POST /general/user`)
- Course model is lightweight -- missing course objectives (kursmaal), assessment methods (required by MYH regulation for course plans)

---

## Phase 2: Student Enrollment, Cohorts & Grading (COMPLETE)

### 2.1 Cohort Model

A cohort (omgang) represents a group of students starting a program together, e.g., "SUVNET24" = the 2024 intake of the SUVNET program.

**Cohort** (`cohorts` table):

| Column | Type | Notes |
|--------|------|-------|
| id | int PK | auto-increment |
| program_id | FK -> programs.id | not null, CASCADE delete, indexed |
| cohort_code | String(20) | unique, indexed (e.g., "SUVNET24") |
| start_date | Date | not null |
| end_date | Date | not null |
| status | String(20) | planned/active/completed, default "planned", indexed |
| study_pace | Integer | 100 = full-time, 50 = half-time, default 100 |
| max_seats | Integer | approved capacity |

Relationships: `program` -> Program, `enrollments` -> StudentEnrollment (cascade delete)

### 2.2 Student Enrollment

Links a student (User with role "student") to a cohort.

**StudentEnrollment** (`student_enrollments` table):

| Column | Type | Notes |
|--------|------|-------|
| id | int PK | auto-increment |
| student_id | FK -> users.id | not null, indexed |
| cohort_id | FK -> cohorts.id | not null, indexed |
| enrollment_date | Date | not null |
| status | String(20) | active/on_leave/graduated/dropped_out, default "active", indexed |
| graduation_date | Date | nullable |

Unique constraint on (student_id, cohort_id).

### 2.3 Grading System

YH uses IG (fail) / G (pass) / VG (pass with distinction). Grades are per student per course.

**Grade** (`grades` table):

| Column | Type | Notes |
|--------|------|-------|
| id | int PK | auto-increment |
| student_id | FK -> users.id | not null, indexed |
| course_id | FK -> courses.id | not null, indexed |
| grade | String(5) | IG/G/VG, not null |
| graded_by | FK -> users.id | not null (teacher/utbildningsledare) |
| graded_at | DateTime | server_default=func.now() |
| notes | Text | nullable |
| is_reexamination | Boolean | default false |

Rules from MYH:
- Grades only set when course is completed AND documentation exists for assessment
- If any course objective is not met, grade must be IG
- Some courses may use IG/G only (no VG distinction)
- Providers have 4 weeks to report grades after assignment
- Grade increases: utbildningsledare can do directly
- Grade reductions: require formal documentation (notes field supports this)

### 2.4 Endpoints

**Cohorts:**

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/programs/{id}/cohorts` | `get_current_user` | List cohorts for a program |
| POST | `/programs/{id}/cohorts` | `get_current_admin` | Create cohort |
| GET | `/cohorts/{id}` | `get_current_user` | Cohort detail with enrolled students |
| PUT | `/cohorts/{id}` | `get_current_admin` | Update cohort |
| DELETE | `/cohorts/{id}` | `get_current_admin` | Delete cohort |

**Enrollments:**

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | `/cohorts/{id}/enroll` | `get_current_staff` | Enroll student in cohort |
| GET | `/cohorts/{id}/students` | `get_current_staff` | List enrolled students |
| PUT | `/enrollments/{id}/status` | `get_current_staff` | Update enrollment status |
| GET | `/students/{id}/enrollments` | `get_current_staff` or self | Student's enrollment history |

**Grades:**

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | `/courses/{id}/grades` | `get_current_staff` | Set grade for student |
| GET | `/courses/{id}/grades` | `get_current_staff` | List grades for a course |
| GET | `/students/{id}/grades` | `get_current_staff` or self | Student's grade overview |
| PUT | `/grades/{id}` | `get_current_staff` | Update a grade (with notes for audit) |

### 2.5 Frontend Pages

- **CohortListPage** -- nested under program detail, shows cohorts for a program
- **CohortDetailPage** -- enrolled students, status, dates, capacity
- **EnrollStudentForm** -- select student user, confirm enrollment in cohort
- **GradesPage** -- grid view: students x courses, editable cells for staff
- **StudentGradesPage** -- student self-service view of their own grades

### 2.6 Cleanup (also in Phase 2)

- Wire up admin user creation endpoint (connect existing `AdminUserCreateSchema` + `create_user_as_admin` to a `POST /general/user` route)
- Remove stale `RegisterPage.jsx` + `RegisterForm.jsx`

---

## Phase 3: User Management, Course Views & Scheduling

### 3.1 User Management Enhancements

Role-based access needs to be properly enforced end-to-end. Currently `get_current_user()` does not check the `disabled` flag, meaning disabled users can still use the system.

**Security fix -- `security.py`:**
- `get_current_user()` must check `user.disabled` and return 403 if true
- When a user is disabled, invalidate all their active tokens

**New backend endpoints (`general.py`):**

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| PUT | `/general/user/{id}` | `get_current_admin` | Admin updates user info (first_name, last_name, email) |
| PUT | `/general/user/{id}/reset-password` | `get_current_admin` | Admin resets user password |
| PUT | `/general/user/{id}/toggle-status` | `get_current_admin` | Admin enables/disables user account |

**New schemas:**
- `AdminUserUpdateSchema` -- first_name (optional), last_name (optional), email (optional)
- `AdminPasswordResetSchema` -- new_password (str, min 8 chars)

**New services:**
- `admin_update_user(db, user_id, data)` -- update user fields, validate email uniqueness
- `admin_reset_password(db, user_id, new_password)` -- hash and set new password
- `toggle_user_status(db, user_id)` -- flip `user.disabled`, invalidate all tokens if disabling

**Frontend -- DashboardUsersPage enhancements:**
- Role filter dropdown (all / admin / utbildningsledare / student)
- "Create User" button linking to `/dashboard/users/new`
- Search by name or email (client-side filter)
- Status column with active/inactive badges (already present, keep)

**Frontend -- DashboardUserPage enhancements:**
- Admin actions panel with sections:
  - **Role change** -- dropdown with available roles (uses existing `PUT /general/user/{id}/role`)
  - **Reset password** -- password input + confirm button (uses new `PUT /general/user/{id}/reset-password`)
  - **Enable/disable** -- toggle button with confirmation (uses new `PUT /general/user/{id}/toggle-status`)
  - **Edit info** -- editable fields for first_name, last_name, email (uses new `PUT /general/user/{id}`)
- Success/error feedback for all actions
- Only show admin actions when the current user is admin

**Seed data update:**
- Update `seed_data.py` to create sample cohorts, enrollments, and grades using the Phase 2 models

### 3.2 Course Views & Grading Improvements

Courses are currently only accessible nested under programs. Add standalone course browsing and per-course grade management.

**New backend endpoints:**

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/courses` | `get_current_user` | List all courses (with optional `?program_id=` filter) |
| GET | `/courses/{id}` | `get_current_user` | Get single course detail |

**Frontend pages:**
- **CoursesPage** -- standalone course listing with program filter dropdown
  - Table: code, name, program name, YH points
  - Click row to view course detail
- **CourseDetailPage** -- individual course view
  - Course info card (code, name, description, YH points, program link)
  - Grades table (staff only): list all grades for this course
  - Add grade form (staff): select student, grade (IG/G/VG), notes

**Sidebar update:**
- Add "Courses" nav item visible to admin and utbildningsledare

**Routes:**
- `/dashboard/courses` -- CoursesPage
- `/dashboard/courses/:courseId` -- CourseDetailPage

### 3.3 Basic Scheduling

A schedule defines when courses are taught within a cohort. Each lesson is a calendar entry tied to a cohort and course.

**New model -- Lesson (`lessons` table):**

| Column | Type | Notes |
|--------|------|-------|
| id | int PK | auto-increment |
| cohort_id | FK -> cohorts.id | not null, indexed, CASCADE delete |
| course_id | FK -> courses.id | not null, indexed, CASCADE delete |
| title | String(200) | not null (e.g., "Python - Lecture 3") |
| start_time | DateTime | not null |
| end_time | DateTime | not null |
| location | String(200) | nullable (room name or "online") |
| description | Text | nullable |
| teacher_id | FK -> users.id | nullable, SET NULL |

Index on (cohort_id, start_time) for efficient schedule queries.

**Schemas:**
- `LessonCreateSchema` -- cohort_id (optional, from path), course_id, title, start_time, end_time, location, description, teacher_id
- `LessonUpdateSchema` -- all fields optional
- `LessonOutSchema` -- all fields + teacher name via relationship

**Services:**
- `create_lesson(db, cohort_id, data)` -- validate cohort, course, teacher exist
- `update_lesson(db, lesson_id, data)`
- `delete_lesson(db, lesson_id)`
- `list_cohort_lessons(db, cohort_id, date_from, date_to)` -- filtered by date range
- `list_student_lessons(db, student_id)` -- lessons for cohorts the student is enrolled in

**Endpoints:**

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/cohorts/{id}/lessons` | `get_current_user` | List lessons for cohort (query: `date_from`, `date_to`) |
| POST | `/cohorts/{id}/lessons` | `get_current_staff` | Create lesson in cohort |
| GET | `/lessons/{id}` | `get_current_user` | Get lesson detail |
| PUT | `/lessons/{id}` | `get_current_staff` | Update lesson |
| DELETE | `/lessons/{id}` | `get_current_admin` | Delete lesson |
| GET | `/students/{id}/schedule` | staff or self | Student's upcoming lessons |

**Frontend pages:**
- **SchedulePage** -- schedule view/management for a cohort
  - Week view showing lessons as time blocks
  - Filter by course, date range
  - Create/edit lesson form (staff only)
  - Accessed from CohortDetailPage ("View Schedule" link)
- **StudentSchedulePage** -- student self-service schedule view
  - Upcoming lessons for enrolled cohort(s)
  - Read-only week/list view

**Sidebar + routes:**
- Add "My Schedule" nav item for students
- `/dashboard/cohorts/:cohortId/schedule` -- SchedulePage
- `/dashboard/my-schedule` -- StudentSchedulePage (student only)

---

## Phase 4: LIA Management & Attendance

### 4.1 Company Registry

**Company** (`companies` table):

| Column | Type | Notes |
|--------|------|-------|
| id | int PK | auto-increment |
| name | String(200) | not null |
| org_number | String(20) | nullable, unique (Swedish organisationsnummer) |
| address | Text | nullable |
| contact_person | String(200) | nullable |
| email | String(255) | nullable |
| phone | String(50) | nullable |
| active | Boolean | default true |

### 4.2 LIA Placements

**LIAPlacement** (`lia_placements` table):

| Column | Type | Notes |
|--------|------|-------|
| id | int PK | auto-increment |
| student_id | FK -> users.id | not null, indexed |
| course_id | FK -> courses.id | not null (must be a LIA course), indexed |
| company_id | FK -> companies.id | nullable, SET NULL, indexed |
| supervisor_name | String(200) | nullable (handledare at workplace) |
| supervisor_email | String(255) | nullable |
| supervisor_phone | String(50) | nullable |
| start_date | Date | nullable |
| end_date | Date | nullable |
| status | String(20) | planned/active/completed/cancelled, default "planned" |
| workplace_assessment_notes | Text | nullable |

Course model enhancement: add `course_type` field (String(20), default "regular") to distinguish LIA courses from regular courses.

Key domain rules:
- Education provider has **ultimate responsibility** for securing LIA placements
- If provider offers a quality-assured placement and student refuses, provider has fulfilled obligation
- LIA is graded like any course (IG/G/VG)
- Student insurance covers accidents during LIA and travel to/from workplace

### 4.3 Attendance Tracking

**AttendanceRecord** (`attendance_records` table):

| Column | Type | Notes |
|--------|------|-------|
| id | int PK | auto-increment |
| student_id | FK -> users.id | not null, indexed |
| course_id | FK -> courses.id | not null, indexed |
| date | Date | not null |
| status | String(30) | present/absent_justified/absent_unjustified |
| notes | Text | nullable |

Unique constraint on (student_id, course_id, date).

Required for CSN reporting -- unjustified absence can lead to withdrawal of student financial aid.

---

## Phase 5: Admissions & Student Lifecycle

### 5.1 Admission Workflow

**Application** (`applications` table):
- Applicant info (may not be existing User yet): name, email, phone
- Program/cohort reference
- Application date, status flow: applied -> eligible -> selected -> admitted -> enrolled (or rejected/waitlisted)
- Supporting documentation notes
- Ledningsgrupp makes final admission decisions

### 5.2 Study Breaks & Interruptions

**StudyBreak** (`study_breaks` table):
- Links to student enrollment
- start_date, planned_return_date, actual_return_date
- Reason and individual study plan notes
- Status: active/returned/converted_to_interruption
- Must notify CSN of status change
- MYH grants no additional seats for returning students

Study interruption (studieavbrott) = permanent: modeled as enrollment status change to "dropped_out" with documentation.

### 5.3 Credit Recognition (Tillgodoraknande)

**CreditRecognition** (`credit_recognitions` table):
- Links to enrollment + specific course
- Basis: formal_education/work_experience/other
- Grade awarded (G or VG -- credited courses cannot be IG)
- Assessed by (FK to users), assessed_at
- Status: pending/approved/rejected
- Supports YH-flex: shortened individual study plans for experienced professionals

### 5.4 Course Model Enhancement

Add optional fields to Course:
- `objectives` (Text) -- kursmaal / learning outcomes
- `assessment_methods` (Text) -- how the course is examined
- `language` (String(50), default "svenska") -- language of instruction

These are required by MYH regulation for course plans (kursplaner) but can be optional in the system.

---

## Phase 6: Compliance & Quality

### 6.1 Diploma/Certificate Logic

Automated eligibility checking:
- **Yrkeshogskoleexamen**: all courses passed (G or VG), minimum 200 credits, thesis completed
- **Kvalificerad yrkeshogskoleexamen**: all courses passed, minimum 400 credits, minimum 25% LIA, thesis completed
- **Utbildningsbevis**: issued when student completes some but not all courses

Ledningsgrupp formally approves diploma/certificate issuance.
Since January 2024, Europass supplements required in Swedish + English.

### 6.2 CSN Reporting Data

Data export capability for:
- Enrollment confirmations (study scope, start/end dates)
- Study activity and attendance summaries
- Interruption reporting (studieuppehall/studieavbrott)
- Results reporting (credits completed)

### 6.3 Course Evaluations

**CourseEvaluation** (`course_evaluations` table):
- Per course per cohort
- Evaluation date, summary notes
- Response count, total students
- Mandatory per MYH quality requirements (studerandeinflytande)

### 6.4 Quality Dashboard

Overview metrics:
- Student throughput (enrollment -> graduation rates)
- Grade distribution per course
- LIA placement success rates
- Attendance statistics
- Employment follow-up at 6 months post-graduation

---

## Appendix: Key YH Terms

| Swedish | English | System relevance |
|---------|---------|-----------------|
| Utbildningsanordnare | Education provider | The organization running programs |
| Utbildningsledare | Education leader | Program manager role |
| Ledningsgrupp | Steering group / board | Governance body (admission, diplomas) |
| Omgang | Cohort | Group of students starting together |
| LIA (Larande i Arbete) | Learning at Work | Workplace learning component |
| Handledare | Workplace supervisor | Mentor during LIA |
| YH-poang | YH credits | 5 credits = 1 week full-time |
| IG / G / VG | Fail / Pass / Pass with distinction | Grading scale |
| Studieuppehall | Study break | Temporary pause, intent to return |
| Studieavbrott | Study interruption | Permanent discontinuation |
| Tillgodoraknande | Credit recognition | Crediting prior learning |
| Kursmaal | Course objectives | Required learning outcomes |
| Kursplan | Course plan / syllabus | Required per course by MYH |
| CSN | Student financial aid agency | Requires attendance/results reporting |
| MYH | National Agency for HVE | Regulatory authority |

Full terminology reference: see `yh_analysis.md` section 24.
