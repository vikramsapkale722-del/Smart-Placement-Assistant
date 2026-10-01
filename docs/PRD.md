# Product Requirements Document (PRD)
## Smart Placement Portal (Greenfield Rebuild)

---

### 1. Document Overview
- **Document Version:** 1.0.0
- **Status:** Approved for Greenfield Foundation (Phase 0)
- **Author:** Product & Architecture Team
- **Product Name:** Smart Placement Portal

---

### 2. Product Vision & Problem Statement

#### 2.1 The Problem
Traditional college placement management processes are fragmented, error-prone, and stressful for all parties involved:
- **Students** navigate disparate communication channels (emails, notice boards, chat groups), encounter confusing eligibility criteria, lack visibility into application statuses, and struggle to manage multiple resume versions.
- **Recruiters & Companies** receive unvetted, poorly formatted applications, face high administrative overhead to schedule rounds and communicate criteria, and lack streamlined portals for student shortlisting.
- **Placement Cells & Administrators** operate manually via spreadsheets, face data inconsistency and verification headaches, lack real-time auditability, and struggle to generate verified reporting for institutional compliance and accreditation (e.g., NAAC, NIRF).

#### 2.2 Product Vision
Build a world-class, professional, web-based College Placement Management Platform that unifies **Students**, **Recruiters/Companies**, and **College Administrators** in an enterprise-grade, responsive, accessible, and intuitive workspace. The platform eliminates administrative friction across the entire placement lifecycle—from onboarding and resume management through job discovery, eligibility checking, application tracking, candidate evaluation, and placement status verification.

---

### 3. Target Users & Personas

#### 3.1 Role 1: Student
- **Primary Goals:** Easily discover campus drives, check real-time eligibility with zero ambiguity, submit verified applications with one click, maintain up-to-date academic and project credentials, and track application stages transparently.
- **Key Pain Points:** Unclear eligibility rules, missing drive deadlines, lack of feedback on submitted applications, manual repetitive data entry.

#### 3.2 Role 2: Company / Recruiter
- **Primary Goals:** Post targeted job and internship openings with clear eligibility filters (CGPA, department, backlogs), review pre-screened student profiles with standardized resumes, update candidate application stages seamlessly, and download candidate shortlists.
- **Key Pain Points:** Sifting through ineligible candidates, disorganized email submissions, delay in candidate stage communication.

#### 3.3 Role 3: Placement Administrator / Cell Coordinator
- **Primary Goals:** Oversee and audit all placement activities, verify student credentials (CGPA, backlogs, department verification), approve or manage company postings, monitor drive analytics, ensure institutional compliance, and generate official placement reports.
- **Key Pain Points:** Fraudulent student data, manual spreadsheet reconciliations, lack of centralized audit trails, high coordination overhead between companies and students.

---

### 4. User Roles & Capabilities Matrix

| Feature / Capability | Student | Recruiter / Company | Placement Admin |
| :--- | :---: | :---: | :---: |
| Register / Sign Up | Yes (Student domain/ID) | Yes (Company domain) | System Provisioned / SuperAdmin |
| Login / Password Reset | Yes | Yes | Yes (with MFA/Audit) |
| Profile & Academic Management | Full (Self) | None | Full (Verify/Edit/Audit) |
| Resume Upload (PDF) & Management | Full | View Only (Applicants) | Full View / Audit |
| Company Profile Management | View Only | Full (Self) | Full (Verify/Edit) |
| Job / Internship Creation | None | Full (Draft/Publish) | Full (Approve/Manage) |
| Define Eligibility Criteria (CGPA, Branch, etc.) | View Only | Full | Full Override |
| Browse & Search Jobs | Full (All published) | Self Postings Only | Full (All Postings) |
| Automatic Eligibility Engine Check | Full (Self feedback) | System Applied | System Applied |
| Apply to Drives / Jobs | Full (If eligible) | None | Admin Assist (On-behalf if approved) |
| Real-time Application Tracking | Full (Own) | Full (For own jobs) | Full (Platform-wide) |
| Candidate Pipeline & Stage Update | None | Full (Applied → Shortlisted → Interview → Offered → Hired / Rejected) | Full Oversight & Override |
| System Reports & Audit Logs | None | Recruiter Analytics | Full Institutional Export & Audit |

---

### 5. Scope & Release Strategy

#### 5.1 MVP Scope (Version 1.0)
1. **Authentication & Identity:** Supabase Auth with email/password, email verification, and secure session management.
2. **Role-Based Access Control (RBAC):** Strict server-side enforcement for `student`, `company`, and `admin` roles.
3. **Student Profile Suite:** Personal details, academic record (CGPA, graduation year, branch/department, 10th/12th percentages, active backlog count), skills, projects, certifications, and PDF resume upload.
4. **Student Dashboard:** Real-time summary of eligible drives, active applications, upcoming deadlines, and profile completion gauge.
5. **Company Profile Suite:** Company details, industry, website, headquarters, description, verified recruiter contact.
6. **Company Dashboard:** Active listings, candidate counts, recent applications, action items.
7. **Job & Internship Management:** Multi-step creation with role title, description, package/stipend (CTC), job location, job type (Full-time, Internship, Dual), deadline, and structured eligibility parameters (minimum CGPA, allowed departments, max allowed backlogs, batch year).
8. **Job Discovery & Application:** Responsive job list with search, department/type/salary filters, comprehensive job detail view, real-time eligibility evaluation badge, and 1-click application submission with resume attachment.
9. **Application Tracking Pipeline:** Kanban-style and table status tracking: `applied`, `under_review`, `shortlisted`, `assessment_round`, `interview_round`, `offered`, `accepted`, `rejected`, `withdrawn`.
10. **Admin Portal:** Consolidated metrics, student directory with verification badges, company directory, job moderation, platform-wide application tracker, and CSV export.
11. **Core UX Excellence:** Responsive layouts (375px, 768px, 1440px), accessible WCAG AA design system, skeleton loaders, clear empty states, feedback toasts, and defensive error boundaries.

#### 5.2 Out of Scope for MVP (Future Phases — Do NOT Build Now)
- AI Resume Parser / Scorer
- AI Placement Assistant Chatbot
- AI Mock Interview Practice & Feedback
- AI Skill Gap Analysis & Recommendation Engine
- Automated WhatsApp & SMS notifications
- Native Mobile Applications (iOS / Android)
- Payment Gateway / Fee Collection
- Student Community & Social Discussion Boards

---

### 6. User Journeys & Critical Flows

#### 6.1 Student Flow
```
Register (Student Email + Roll No)
  → Complete Profile (Academics, Branch, CGPA, Backlogs, Skills, Projects)
  → Upload Verified PDF Resume
  → Student Dashboard
  → Job Discovery (Filter by eligible/all, branch, salary)
  → Job Details (Clear Eligibility Feedback: Met vs Unmet Criteria)
  → Apply (Confirmation modal with resume snapshot)
  → Track Application (Live stage status + history timeline)
```

#### 6.2 Company Flow
```
Register (Company Email + Details)
  → Complete Company Profile
  → Recruiter Dashboard
  → Create Job / Internship Posting (Set title, CTC, deadlines, CGPA & Branch criteria)
  → Publish Job
  → View Inbound Applications (Filter by CGPA, branch, status)
  → Review Candidate Profile & Resume Preview
  → Update Application Stage (Shortlist / Interview / Offer / Reject)
  → Export Candidate List
```

#### 6.3 Administrator Flow
```
Secure Admin Login
  → Executive Placement Dashboard (KPIs: Placement %, Average CTC, Total Drives)
  → Manage & Verify Students (Review records, flag discrepancies, bulk import/verify)
  → Moderate & Verify Companies & Drives
  → Audit Application Stages
  → Generate Institutional Reports (NAAC/NIRF accreditation format)
  → Monitor System Audit Logs
```

---

### 7. Important Business & Validation Rules

1. **Eligibility Enforcement:**
   - A student CANNOT submit an application to a drive if their verified CGPA is below the drive’s threshold, or if they have more active backlogs than allowed, or if their department/batch is not on the allowed list.
   - The UI must explicitly inform the student *why* they are ineligible before they attempt to apply.
2. **Duplicate Application Prevention:**
   - A student can only apply once to a specific job posting. Unique constraint enforced at the database level (`UNIQUE(job_id, student_id)`).
3. **Application Immutability & Auditability:**
   - Once submitted, an application cannot be altered by a student, but can be withdrawn if the deadline has not passed.
   - Every status change by a recruiter or admin must generate an immutable record in `application_status_history`.
4. **Resume Verification:**
   - Supported format: PDF only. Maximum size: 5 MB. Stored securely in Supabase Storage with signed download URLs or authenticated access.
5. **One-Offer Policy (Configurable by Admin):**
   - System supports placement policy configuration (e.g., dream job rules, or locking further applications once an offer above a certain CTC is accepted).

---

### 8. Success Criteria & Quality Metrics
- **Performance:** Lighthouse performance score >= 90; Core Web Vitals (LCP < 2.5s, CLS < 0.1, FID < 100ms).
- **Reliability:** Zero unhandled runtime exceptions; comprehensive error boundaries and toast notifications.
- **Accessibility:** Compliance with WCAG 2.1 AA standards (contrast >= 4.5:1, keyboard navigability, screen-reader semantic HTML).
- **Security:** Zero client-side privilege escalation; 100% server-side RBAC validation; Supabase Row Level Security (RLS) on all tables; strict content security policies.
- **Responsiveness:** Seamless usability on mobile (375px), tablet (768px), and modern desktop displays (1440px+).
