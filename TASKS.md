# Granular Task Breakdown
## Smart Placement Portal

Every implementation phase is broken down into small, independently testable, single-focus tasks. Never attempt multiple tasks simultaneously.

---

### PHASE 0 — Project Foundation (Completed)
- [x] **TASK-000:** Initialize complete project documentation, rules, architecture, schema, design system, and roadmap.

---

### PHASE 1 — Authentication Foundation (Completed)
- [x] **TASK-001:** Initialize Next.js 14+ TypeScript project, base Tailwind setup, and clean folder structure (`src/app`, `src/components`, `src/features`, `src/services`, `src/lib`, `src/types`, `src/utils`).
- [x] **TASK-002:** Establish Supabase Auth Foundation (SSR clients, Edge session middleware, Zod schemas, Server Actions, Login/Register UI routes).
- [x] **TASK-003:** Authentication UI & Complete User Flow (Register with confirm password, Login, Authenticated State, Logout, Responsive 375/768/1440px).

---

### PHASE 2 — Role-Based Authorization & Access Control (Completed)
- [x] **TASK-004 — ROLE-BASED AUTHORIZATION & ACCESS CONTROL:**
  - Strongly typed role definitions (`USER_ROLES`, `UserRole`, `isValidRole`) in `src/types/index.ts` and `src/lib/auth/roles.ts`.
  - Server-side authorization utilities in `src/services/rbac.service.ts` (`requireAuthenticatedUser`, `requireRole`, `requireAnyRole`, `requireStudent`, `requireCompany`, `requireAdmin`).
  - Next.js Edge Middleware route guards protecting `/student/*`, `/company/*`, and `/admin/*`.
  - Anti-tamper barrier explicitly dropping self-promoted `admin` claims in `user_metadata`.
  - Professional 403 access denied view at `/unauthorized`.
  - Minimal protected placeholder views at `/student`, `/company`, `/admin` proving server-side enforcement.
  - Role-aware boundary navigation on `/`.
  - Automated tests: 38/38 Vitest unit tests passing; 39/39 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px).
  - TypeScript type check (`npm run typecheck`), ESLint (`npm run lint`), and Next.js production build (`npm run build`) passing with zero errors.

---

### PHASE 3 — Student Profile Suite
- [x] **TASK-005 — STUDENT PROFILE FOUNDATION:**
  - Relational database schema: `users`, `student_profiles`, `student_skills`, `student_projects`, `student_certifications`, and `student_achievements` in migration `supabase/migrations/20260929000001_student_profile_foundation.sql`.
  - Type-safe contracts: `CompleteStudentProfile`, `StudentSkillInput`, `StudentProjectInput`, `StudentCertificationInput`, `StudentAchievementInput` in `src/features/student/types.ts` and `src/types/database.types.ts`.
  - Strict validation: `studentProfileSchema`, `studentSkillSchema`, `studentProjectSchema`, `studentCertificationSchema`, `studentAchievementSchema`, and `validateProfilePhoto` in `src/features/student/schemas.ts`.
  - Data access layer: `studentService` in `src/services/student.service.ts` (`getProfile`, `upsertProfile`, `uploadProfilePhoto`).
  - Next.js Server Actions: `getStudentProfileAction`, `saveStudentProfileAction`, `uploadProfilePhotoAction` in `src/features/student/actions.ts` with server-side session identity enforcement.
  - Accessible UI: `StudentProfileForm` in `src/features/student/components/StudentProfileForm.tsx` with photo upload, reactive validation, skills tagging, projects, certifications, achievements, and links.
  - Protected Page: `/student/profile` at `src/app/(protected)/student/profile/page.tsx` enforcing student role verification and data pre-loading.
  - Test suites: 54/54 Vitest unit tests passing; 48/48 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px).
  - Clean builds: 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build`).

---

### PHASE 4 — Student Dashboard Suite
- [x] **TASK-006 — STUDENT DASHBOARD FOUNDATION:**
  - Dynamic Profile Completion Engine (`src/features/student/utils/profile-completion.ts`) evaluating actual profile data with weighted sections (Personal 15%, Academic 30%, Skills 20%, Projects 15%, Links 10%, Photo 10%) and readiness gate.
  - Production-grade SaaS Student Dashboard Component (`src/features/student/components/StudentDashboard.tsx`) with 9 essential sections: Header, Completion Gauge, Profile Summary, Resume Status, Placement Readiness Checklist, Quick Actions, Placement Opportunities Preview, Application Activity Preview, and Account Milestones.
  - Protected Page Route (`/student` at `src/app/(protected)/student/page.tsx`) enforcing server-side `rbacService.requireStudent()`, loading real profile data via `studentService.getProfile(user.id)`, and calculating dynamic metrics server-side.
  - Accessible Skeleton Loading State (`src/app/(protected)/student/loading.tsx`) and Error Boundary with reset capability (`src/app/(protected)/student/error.tsx`).
  - Strict empty states for future modules (Resume Management Phase 10, Opportunities Phase 7, Application Pipeline Phase 8) without fake records or fabricated statistics.
  - Automated tests: 60/60 Vitest unit tests passing; 57/57 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px).
  - Clean builds: 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build`).
- [ ] **TASK-007:** Build Profile Completion Progress Gauge and Alert Banners for incomplete records.
- [ ] **TASK-008:** Build Student Metric KPI Cards (Active Applications, Shortlisted Drives, Upcoming Deadlines).
- [ ] **TASK-009:** Build Quick-Access Eligible Drives Feed with Skeleton Loaders.

### PHASE 4 — Student Dashboard
- [ ] **TASK-014:** Implement Student Dashboard Shell and Navigation Sidebar/Navbar.
- [ ] **TASK-015:** Build Profile Completion Progress Gauge and Alert Banners for incomplete records.
- [ ] **TASK-016:** Build Student Metric KPI Cards (Active Applications, Shortlisted Drives, Upcoming Deadlines).
- [ ] **TASK-017:** Build Quick-Access Eligible Drives Feed with Skeleton Loaders.

---

### PHASE 5 — Company Profile Suite
- [x] **TASK-007 — COMPANY PROFILE FOUNDATION:**
  - Relational database schema with `companies` and `company_users` tables in migration `supabase/migrations/20260929000002_company_profile_foundation.sql`.
  - Type-safe contracts in `src/types/database.types.ts` and `src/features/company/types.ts`.
  - Strict validation schemas in `src/features/company/schemas.ts` (`companyProfileSchema`, `validateCompanyLogo`).
  - Authoritative data access service `companyService` in `src/services/company.service.ts` (`getProfile`, `upsertProfile`, `uploadLogo`).
  - Next.js Server Actions in `src/features/company/actions.ts` (`getCompanyProfileAction`, `saveCompanyProfileAction`, `uploadCompanyLogoAction`).
  - Interactive company profile workspace `CompanyProfileManager.tsx` supporting View Mode, Edit Mode, and First-Time Setup Empty State.
  - Protected Page Route `/company/profile` live with server-side RBAC guard (`rbacService.requireCompany()`), skeleton loader (`loading.tsx`), and error boundary (`error.tsx`).
  - Automated tests: 79/79 Vitest unit tests passing; 69/69 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px).
  - Clean builds: 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build`).
- [x] **TASK-008 — COMPANY VERIFICATION STATUS BANNER & ADMINISTRATIVE WORKFLOW:**
  - Dedicated `CompanyVerificationBanner` component (`src/features/company/components/CompanyVerificationBanner.tsx`) presenting clear, real-time verification indicators (`✓ Verified Active` vs `⏳ Review Pending`) with recruitment capability checklists.
  - Integration across recruiter views: rendered prominently in `/company/profile` and on recruiter gateway `/company`.
  - Authoritative administrative service methods in `src/services/company.service.ts` (`listAllCompanies`, `verifyCompany`, `revokeVerification`) updating `is_verified`, `verified_by`, and `verified_at`.
  - Administrative Server Actions in `src/features/admin/actions.ts` enforcing strict `rbacService.requireAdmin()` checks and path revalidation.
  - Interactive Company Verification Review Queue (`CompanyVerificationTable.tsx`) at `/admin/companies` with status filtering (`All`, `Pending Review`, `Verified Active`), keyword search, and one-click approve/revoke controls.
  - Protected Page Route `/admin/companies` with server-side RBAC guard, skeleton loader (`loading.tsx`), and error boundary (`error.tsx`).
  - Automated tests: 87/87 Vitest unit tests passing; 81/81 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px).
  - Clean builds: 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build`).
- [x] **TASK-009 — COMPANY DASHBOARD FOUNDATION:**
  - Dynamic Company Profile Completion Engine (`src/features/company/utils/profile-completion.ts`) evaluating 7 organizational categories (Identity, Description, Contact, Location, Logo, Website, Structure) with hiring readiness evaluation.
  - Production-grade SaaS Enterprise Recruiter Dashboard UI (`src/features/company/components/CompanyDashboard.tsx`) with dynamic header, verification status, metric KPI cards, organization overview, quick actions, and preview empty states.
  - Protected Page Route (`/company` at `src/app/(protected)/company/page.tsx`) enforcing server-side `rbacService.requireCompany()`, fetching live company profile via `companyService.getProfile(user.id)`, and calculating profile completeness.
  - Accessible Skeleton Loading State (`src/app/(protected)/company/loading.tsx`) and Error Boundary (`src/app/(protected)/company/error.tsx`).
  - Strict empty states for future modules (Job Postings in Phase 7, Application Pipeline in Phase 8) without fake records or fabricated statistics.
  - Automated tests: 93/93 Vitest unit tests passing; 93/93 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px).
  - Clean builds: 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build`).

---

### PHASE 6 — Company Dashboard (Completed)
- [x] **TASK-009:** Build Company Dashboard Foundation & Real Organization Overview (`/company`).

---

### PHASE 7 — Jobs & Internships Engine (In Progress)
- [x] **TASK-010 — JOB POSTING ENGINE FOUNDATION:**
  - Relational database schema with normalized `jobs` table in migration `supabase/migrations/20260929000003_jobs_foundation.sql` featuring controlled status lifecycle (`draft`, `published`, `closed`, `archived`), academic eligibility parameters (min CGPA 0.00-10.00, allowed departments, max active backlogs, eligible batch years), compensation structure (min/max CTC, monthly stipend, display text), and multi-tenant RLS policies.
  - Type-safe contracts: `JobRow`, `JobPosting`, `CreateJobInput`, `UpdateJobInput`, `CompanyJobCounts` in `src/types/database.types.ts` and `src/features/jobs/types.ts`.
  - Server-side validation: `createJobSchema`, `updateJobSchema`, `updateJobStatusSchema` in `src/features/jobs/schemas.ts` enforcing strict numeric constraints, deadline validation, and CTC range rules.
  - Data access layer: Authoritative `jobService` in `src/services/job.service.ts` (`getRecruiterCompanyId`, `createJob`, `getJobsByCompany`, `getJobById`, `updateJob`, `updateJobStatus`, `deleteJob`, `getCompanyJobCounts`).
  - Next.js Server Actions: `createJobAction`, `updateJobAction`, `updateJobStatusAction`, `deleteJobAction` in `src/features/jobs/actions.ts` deriving company identity strictly from authenticated sessions (`rbacService.requireCompany()`).
  - Recruiter UI components: `JobListTable.tsx` and `JobCreationForm.tsx` in `src/features/jobs/components/` supporting job creation, publishing, status changes, and deletion with responsive feedback.
  - Protected Page Routes: `/company/jobs` (`src/app/(protected)/company/jobs/page.tsx`), `/company/jobs/new` (`src/app/(protected)/company/jobs/new/page.tsx`), skeleton loading state (`loading.tsx`), and error boundary (`error.tsx`).
  - Dashboard integration: Real dynamic metrics (`totalJobs`, `activeJobs`) integrated into `CompanyDashboard.tsx` and `/company/page.tsx`.
  - Automated tests: 108/108 Vitest unit tests passing; 117/117 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px).
  - Clean builds: 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build` - 16/16 static pages generated).
- [x] **TASK-011 — STUDENT JOB DISCOVERY LISTING:**
  - Protected Student Route `/student/jobs` enforcing server-side `rbacService.requireStudent()`.
  - Filtered retrieval via `jobService.getPublishedJobs()` ensuring only active published jobs are returned (excluding draft, closed, archived, and expired postings).
  - Search engine supporting title, company name, department, location, and technical skills.
  - Multi-criteria filter system (Employment Type, Workplace Mode, Department/Branch, Graduation Batch, and personalized "Show Only Roles I Am Eligible For").
  - Deterministic sorting (Newest, Application Deadline, Highest CTC, Role Title A-Z) with responsive pagination controls.
  - High-end SaaS student job card (`StudentJobCard.tsx`) displaying company monogram, tags, compensation, CGPA gate, required skills, and deadline urgency indicators.
  - Centralized academic eligibility computation engine (`src/services/eligibility.service.ts`) evaluating CGPA, backlogs, branch, and cohort criteria with itemized pass/fail reasons.
  - Detailed student job view route `/student/jobs/[jobId]` (`JobDetailView.tsx`) with comprehensive role overview, company info, interview workflow, academic gates breakdown, and "Apply Now" action modal.
  - Student Dashboard integration (`StudentDashboard.tsx`) linking directly to `/student/jobs`.
  - Testing & Quality Gates: 127/127 Vitest unit tests passing; 150/150 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px); 0 typecheck errors, 0 ESLint warnings; production build passing (17/17 routes generated).

---

### PHASE 8 — Job Applications & Pipeline (In Progress)
- [x] **TASK-012 — JOB APPLICATION ENGINE FOUNDATION:**
  - Relational database schema with normalized `job_applications` and `application_status_history` tables in migration `supabase/migrations/20260929000004_job_applications_foundation.sql` featuring unique constraint `UNIQUE(job_id, student_id)` for duplicate prevention, status check constraint (`applied`, `withdrawn`, `shortlisted`, `in_review`, `offered`, `rejected`), optimization indexes, and multi-tenant RLS policies.
  - Type-safe contracts: `JobApplicationRow`, `JobApplication`, `SubmitApplicationInput`, `ApplicationStatusHistoryItem` in `src/features/applications/types.ts` and updated `src/types/database.types.ts`.
  - Strict input validation schema `submitApplicationSchema` in `src/features/applications/schemas.ts`.
  - Authoritative data access layer: `applicationService` in `src/services/application.service.ts` (`submitApplication`, `hasApplied`, `getExistingApplication`, `getApplicationById`, `getStudentApplications`) performing end-to-end server-side eligibility re-evaluation, active deadline validation, published status verification, and duplicate blocking.
  - Next.js Server Actions: `submitApplicationAction` and `checkHasAppliedAction` in `src/features/applications/actions.ts` deriving student identity strictly from authenticated server sessions (`rbacService.requireStudent()`).
  - Interactive Student Job Details UI: Updated `JobDetailView.tsx` with live Apply Now modal, cover note support, loading spinners, post-submission confirmation view with reference ID, and persistent "✓ Already Applied" badge and disabled CTA states.
  - Protected Page Route: `/student/jobs/[jobId]` updated to query and pass existing application status server-side.
  - Testing & Quality Gates: 141/141 Vitest unit tests passing; 171/171 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px); 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build` - 17/17 static pages generated).
- [x] **TASK-013 — STUDENT APPLICATION TRACKING VIEW:**
  - Protected Student Route `/student/applications` at `src/app/(protected)/student/applications/page.tsx` strictly guarded by `rbacService.requireStudent()`, deriving identity from authenticated server session and preventing cross-role access.
  - Extended data access layer `applicationService.getStudentApplications(userId)` and `getApplicationStatusHistory(applicationId)` in `src/services/application.service.ts` joining full job metadata (title, location, employmentType, department, workplaceType, company info) and recruitment status progression history.
  - Status system utility (`status-timeline.ts`) providing user-friendly status labels, semantic badge variants, and deterministic recruitment progression timelines (`Applied` -> `In Review` -> `Shortlisted` -> `Offered`) with strict isolation of future stages and terminal state rendering (`Rejected`, `Withdrawn`).
  - High-end SaaS student applications view (`StudentApplicationsView.tsx`) with filter tabs (`All`, `Applied`, `In Review`, `Shortlisted`, `Offered`, `Rejected`, `Withdrawn`), sort controls (`Newest`, `Oldest`, `Recently Updated`), comprehensive application cards, status timeline stepper, collapsible cover notes, and direct links to placement drives.
  - Professional empty state with "You haven't applied to any jobs yet" and "Explore Placement Drives" CTA button linking to `/student/jobs`.
  - Accessible skeleton loading state (`loading.tsx`) and error boundary with retry capability (`error.tsx`).
  - Student Dashboard integration (`StudentDashboard.tsx`) linking Section 8 directly to `/student/applications`.
  - Quality Gates: 150/150 Vitest unit tests passing (`tests/unit/student-applications.test.ts`), 192/192 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px), 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build` - 18/18 static pages generated).
- [x] **TASK-014 — RECRUITER APPLICANT MANAGEMENT BOARD:**
  - Protected Recruiter Route `/company/jobs/[id]/applicants` at `src/app/(protected)/company/jobs/[id]/applicants/page.tsx` strictly guarded by `rbacService.requireCompany()`, deriving recruiter identity from authenticated server session and verifying job ownership server-side. Multi-tenant company isolation prevents Company A recruiter from accessing Company B's applicants.
  - Extended type contracts: `ApplicantCandidateProfile`, `ApplicantDetailItem` in `src/features/applications/types.ts`.
  - Validation schema: `updateApplicationStatusSchema` in `src/features/applications/schemas.ts` enforcing valid status transitions and remark length constraints.
  - Authoritative data access layer: `applicationService.getCompanyJobApplicants(userId, jobId)`, `applicationService.getApplicantDetails(userId, applicationId)`, and `applicationService.updateRecruiterApplicationStatus(userId, applicationId, newStatus, remarks)` in `src/services/application.service.ts` supporting full candidate joins, relational sub-collections (skills, projects, certifications, achievements), audit timeline retrieval, and in-memory mock fallback with realistic seeds.
  - Next.js Server Action: `updateRecruiterApplicationStatusAction` in `src/features/applications/actions.ts` enforcing `rbacService.requireCompany()`, input validation, and automatic path cache revalidation.
  - Enterprise Recruiter Board UI: `RecruiterApplicantBoard.tsx` featuring:
    - Job header with company name, location, employment type, mode, department, status, application deadline, and "← Back to Company Jobs" link.
    - 5 KPI summary cards (Total Applicants, In Review, Shortlisted, Offered, Rejected).
    - Multi-criteria search input (candidate name, college, branch, ref ID) and status filter tabs (`All`, `Applied`, `In Review`, `Shortlisted`, `Offered`, `Rejected`, `Withdrawn`).
    - Deterministic sorting dropdown (`Newest Applications`, `Oldest Applications`, `Highest CGPA`, `Recently Updated`).
    - Responsive layout: desktop enterprise table and mobile candidate cards with zero horizontal overflow (`scrollWidth <= clientWidth + 2`).
    - Accessible candidate review slide-over drawer with full academic profile, verified CGPA, skills, projects, certifications, external links (GitHub, LinkedIn, Portfolio), cover note, recruiter status management form with remarks input, and chronological audit history timeline.
    - Global empty state ("No applications yet") and filtered empty state ("No applicants match your filters" with "Clear Filters" action).
  - Integration: Added "Applicants" navigation button to `JobListTable.tsx` for fast access from company jobs roster.
  - Accessible skeleton loading state (`loading.tsx`) and error boundary with retry capability (`error.tsx`).
  - Automated tests: 13 new unit tests in `tests/unit/company-applicants.test.ts` (163/163 Vitest tests passed); 24 new E2E tests in `tests/e2e/company-applicants.spec.ts` (216/216 Playwright tests passed across Mobile 375px, Tablet 768px, and Desktop 1440px).
  - Quality Gates: 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build` - 18 routes generated).
- [x] **TASK-015 — RECRUITER CANDIDATE STAGE TRANSITION & PIPELINE AUTOMATION:**
  - Centralized Transition Engine (`src/features/applications/utils/transitions.ts`) providing authoritative status transition validation:
    - Linear hiring progression: `applied` -> `in_review` -> `shortlisted` -> `offered`.
    - Terminal states: `rejected`, `withdrawn`, `offered`.
    - Rejection supported from any active non-terminal stage (`applied`, `in_review`, `shortlisted`).
    - Withdrawn applications protected as immutable (recruiter cannot alter student-withdrawn applications).
    - Disallows arbitrary jumping (e.g. `applied` -> `offered`) and backward transitions (e.g. `in_review` -> `applied`).
  - Server-Authoritative Transition Action (`applicationService.updateRecruiterApplicationStatus` & `updateRecruiterApplicationStatusAction`):
    - Session-derived recruiter identity (`changed_by`), never trusting client claims.
    - Company-tenant isolation enforced via server-side job ownership verification.
    - Exactly one immutable `application_status_history` audit record per transition.
    - Automatic Next.js path cache revalidation for both recruiter route (`/company/jobs/[id]/applicants`) and student tracker (`/student/applications`).
  - Recruiter Board UI Polish (`RecruiterApplicantBoard.tsx`):
    - Stage transition select menu dynamically populated only with permissible next statuses.
    - Terminal warning banner before confirming terminal outcomes (`Offered`, `Rejected`).
    - Informative terminal outcome badge & notice cards for candidates in `Offered`, `Rejected`, or `Withdrawn` status.
    - Live pipeline KPI metrics update immediately upon transition.
  - Testing & Quality Gates: 181/181 Vitest unit tests passing (18 dedicated transition tests in `stage-transitions.test.ts`), 225/225 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px), 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build` - 18 routes generated). Zero database migration required.
- [x] **TASK-016 — APPLICATION STATUS HISTORY MODAL FOR FULL AUDIT TRANSPARENCY:**
  - Accessible, responsive Status History Dialog/Modal (`ApplicationStatusHistoryModal.tsx`) providing full audit transparency for both students (`/student/applications`) and recruiters (`/company/jobs/[id]/applicants`).
  - Features chronological transition log, previous and new status badges, timestamp for every transition, actor/system attribution, recruiter remarks callout, and clear terminal-state presentation (`Offered`, `Rejected`, `Withdrawn`).
  - Server-authoritative data layer in `applicationService` (`getStudentApplicationStatusHistory`, `getRecruiterApplicationStatusHistory`) and server actions (`getStudentApplicationHistoryAction`, `getRecruiterApplicationHistoryAction`) enforcing strict student ownership isolation and recruiter multi-tenant company isolation derived from verified server sessions.
  - Integration across candidate and recruiter views:
    - Student application tracker (`StudentApplicationsView.tsx`): Dedicated "Status History" button on every application card opening chronological audit log modal.
    - Recruiter applicant board (`RecruiterApplicantBoard.tsx`): Dedicated "History" action button in desktop candidate table, mobile candidate cards, and "Full Audit Modal ↗" in candidate review drawer.
  - Zero reliance solely on color: status presentation incorporates textual badges, accessible glyphs (`📋`, `🔍`, `★`, `✓`, `✕`, `⊘`), and clear semantic tags.
  - Full keyboard accessibility with Escape key listener, backdrop dismiss, and ARIA dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`).
  - Testing & Quality Gates: 209/209 Vitest unit tests passing (including 28 dedicated status history and modal component tests), 261/261 Playwright E2E tests passing across Mobile (375px), Tablet (768px), and Desktop (1440px), 0 TypeScript errors (`npm run typecheck`), 0 ESLint warnings (`npm run lint`), production build passing (`npm run build` - 18 routes generated). Zero database migration required.

---

### PHASE 9 — Admin Placement Portal
- [ ] **TASK-038:** Implement Admin Service (`src/services/admin.service.ts`) with privileged aggregation queries.
- [ ] **TASK-039:** Build Admin Executive Placement Dashboard (`/admin/dashboard`) with campus-wide statistics.
- [ ] **TASK-040:** Build Admin Student Directory with academic verification toggle (`/admin/students`).
- [ ] **TASK-041:** Build Admin Company & Job Moderation Table (`/admin/companies`, `/admin/jobs`).
- [ ] **TASK-042:** Implement CSV Export for Placed Students and Drive Summary Reports.

---

### PHASE 10 — Resume Management & Secure Storage
- [ ] **TASK-043:** Configure Supabase Private Storage Bucket `resumes` with secure RLS policies.
- [ ] **TASK-044:** Implement Resume Upload Component with PDF drag-and-drop, 5MB limit, and client validation.
- [ ] **TASK-045:** Implement Server-Side Signed URL Generator for authorized resume viewing (15-minute expiration).

---

### PHASE 11 — Search & Filtering Polish
- [ ] **TASK-046:** Implement Debounced Full-Text Search across job titles, companies, and student directories.
- [ ] **TASK-047:** Implement Multi-select Faceted Filters (Branch, Package Range, Work Mode) with URL query state persistence.

---

### PHASE 12 — Notifications System
- [ ] **TASK-048:** Implement Notification Service and schema for in-app alert delivery.
- [ ] **TASK-049:** Build In-App Notification Bell & Dropdown with unread counter and read-state management.

---

### PHASE 13 — Automated Testing
- [ ] **TASK-050:** Implement Vitest Unit Tests for Eligibility Computation and Validation Schemas.
- [ ] **TASK-051:** Setup Playwright Test Suite and configure multi-device viewport tests (375px, 768px, 1440px).
- [ ] **TASK-052:** Implement E2E Test: Student Full Application Journey.
- [ ] **TASK-053:** Implement E2E Test: Recruiter Drive Creation & Candidate Stage Progression.
- [ ] **TASK-054:** Implement E2E Test: Admin Verification & Report Export.

---

### PHASE 14 — Security Hardening & Penetration Review
- [ ] **TASK-055:** Perform RLS Penetration Testing across all tables.
- [ ] **TASK-056:** Implement HTTP Security Headers (CSP, HSTS, X-Frame-Options) in Next.js config.

---

### PHASE 15 — Performance Optimization
- [ ] **TASK-057:** Optimize Web Vitals (Font loading, dynamic imports for heavy modals, image optimization).
- [ ] **TASK-058:** Validate Lighthouse Performance score >= 90 across all key pages.

---

### PHASE 16 — Preview Deployment
- [ ] **TASK-059:** Configure Vercel Preview Deployments and link Supabase preview environment.

---

### PHASE 17 — Production Deployment
- [ ] **TASK-060:** Production Vercel Deployment, custom domain setup, and production SSL verification.

---

### PHASE 18 — Telemetry & Monitoring
- [ ] **TASK-061:** Configure Error Boundary Telemetry, performance logging, and audit health check.

---

### PHASE 19 — Future AI Features (Deferred)
- [ ] **TASK-062:** Design Decoupled AI Placement Copilot Service Interface (Deferred).
