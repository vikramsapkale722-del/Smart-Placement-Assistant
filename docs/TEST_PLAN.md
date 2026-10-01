# Comprehensive Test Plan
## Smart Placement Portal

---

### 1. Testing Philosophy & Quality Gate Strategy

Quality is verified using the Testing Pyramid:
1. **Unit Tests (Vitest / Jest):** Pure functions, algorithmic eligibility checking, date validation, schema rules.
2. **Integration Tests:** Service layer workflows, database RLS policies, server actions with mock or test databases.
3. **End-to-End (E2E) Tests (Playwright):** Complete vertical user journeys across browsers, viewports, and simulated role authentications.

> **Quality Gate:** No feature is considered complete until all acceptance criteria pass unit, integration, and E2E validation.

---

### 2. Test Suites by Domain & Role

#### 2.1 Authentication & Security Suite
- **TC-AUTH-01:** Student signup with valid university credentials creates pending account.
- **TC-AUTH-02:** Recruiter signup with corporate email creates pending verification account.
- **TC-AUTH-03:** Login with valid credentials redirects to role-appropriate dashboard (`/student/dashboard`, `/company/dashboard`, `/admin/dashboard`).
- **TC-AUTH-04:** Login with invalid email/password displays user-friendly error without leaking user existence.
- **TC-AUTH-05:** Protected route enforcement: Unauthenticated user visiting `/student/dashboard` is redirected to `/login?redirectTo=...`.
- **TC-AUTH-06:** Cross-role authorization: Authenticated student attempting `/admin/*` receives 403 Forbidden.
- **TC-AUTH-07:** Session logout successfully revokes tokens, clears cookies, and redirects to home page.

#### 2.2 Student Experience Suite
- **TC-STUD-01: Profile Management:** Complete academic profile entry (CGPA, branch, backlogs, 10th/12th percentages); validates range constraints (CGPA 0.0-10.0).
- **TC-STUD-02: Resume Upload:** Upload valid PDF (< 5MB) succeeds and displays preview link; invalid format (.exe, .docx) or oversized file (> 5MB) rejected with clear error.
- **TC-STUD-03: Job Discovery & Filtering:** Search jobs by company name, filter by department, minimum package, and toggle "Eligible Only".
- **TC-STUD-04: Eligibility Engine (Pass):** Student meeting all requirements (CGPA >= min, 0 backlogs <= max, matching branch) sees green "Eligible to Apply" banner and active "Apply" button.
- **TC-STUD-05: Eligibility Engine (Fail):** Student with CGPA below requirement or active backlogs sees red/amber "Not Eligible" banner with exact itemized reasons; "Apply" button is disabled.
- **TC-STUD-06: Application Submission:** One-click apply confirms resume selection, creates application record, snapshots student eligibility data, and updates UI to "Applied".
- **TC-STUD-07: Duplicate Application Prevention:** Attempting to apply again to the same drive is blocked client and server-side.
- **TC-STUD-08: Application Tracking:** Student dashboard displays live status badge (`applied`, `shortlisted`, etc.) and timeline modal with stage history.

#### 2.3 Company / Recruiter Suite
- **TC-COMP-01: Company Profile:** Complete company profile, logo upload, recruiter contact information.
- **TC-COMP-02: Drive Creation & Criteria:** Create job posting with title, CTC range, job description, allowed departments, min CGPA, max backlogs, and deadline.
- **TC-COMP-03: Drive Publishing:** Transition job from `draft` to `published`; verify it appears in student feed.
- **TC-COMP-04: Applicant Review:** View inbound applicant table; sort by CGPA; search by student name/roll number.
- **TC-COMP-05: Resume Access:** Click applicant resume; verify server generates valid signed URL.
- **TC-COMP-06: Status Transition:** Update applicant status from `applied` to `shortlisted` or `rejected`; verify history record created and student sees updated state.

#### 2.4 Placement Admin Suite
- **TC-ADM-01: Metrics Overview:** Admin dashboard displays verified total students, active drives, total applications, and placement rate.
- **TC-ADM-02: Student Verification:** Placement officer reviews student transcript/CGPA and toggles `is_academically_verified`.
- **TC-ADM-03: Company Moderation:** Admin approves new company registration and grants posting privileges.
- **TC-ADM-04: Application Oversight:** Admin views master application log across all drives.
- **TC-ADM-05: Data Export:** Export student placement status report to CSV.

---

### 3. Responsive Viewport Testing Matrix

All pages must render seamlessly across the following viewports in Playwright:

| Viewport | Device Archetype | Resolution | Focus Areas |
| :--- | :--- | :--- | :--- |
| **Mobile** | iPhone 14 / Pixel 7 | `375 x 667` | Drawer navigation, tap targets (>= 44px), single-column forms, responsive tables (card mode) |
| **Tablet** | iPad Mini / Air | `768 x 1024` | Sidebar collapse/expand, 2-column KPI grids, modal fit |
| **Desktop** | Standard Laptop | `1440 x 900` | Full multi-column dashboard, sticky navigation, full data tables, modal dialogs |

---

### 4. Accessibility & UI State Verification

1. **Accessibility (WCAG 2.1 AA):**
   - Automated axe-core scans in Playwright tests (`@axe-core/playwright`).
   - Color contrast ratio >= 4.5:1 for normal text, >= 3:1 for large headings and active controls.
   - Screen-reader accessible form labels, ARIA attributes on modals, dialogs, and tabs.
   - Full keyboard navigation (focus rings visible, Tab/Shift-Tab order logical, ESC dismisses dialogs).
2. **Defensive UI States:**
   - **Loading State:** Skeletons displayed during async queries; buttons show spinner and prevent duplicate submissions.
   - **Empty State:** Clean illustrated empty state with action buttons when zero results exist.
   - **Error State:** Error boundaries catch rendering failures gracefully with "Try again" action.
