# Architecture Decision Records (ADRs)
## Smart Placement Portal

---

### ADR-001: Next.js App Router with TypeScript as Core Framework
- **Status:** Approved
- **Context:** The application requires server-side rendering for security and fast initial loads, robust API routes/server actions for data mutations, and a rich interactive client layer for reactive dashboards and filtering.
- **Decision:** Use Next.js 14+ with App Router and TypeScript.
- **Alternatives Considered:**
  - *Vite + React SPA with Express backend:* Increased maintenance of two separate codebases; manual JWT session synchronization; worse SEO and initial load.
  - *Remix:* Strong alternative, but Next.js has deeper enterprise ecosystem support, superior Vercel deployment primitives, and native Server Actions.
- **Consequences:** Single cohesive full-stack TypeScript codebase, unified type sharing between UI and API, streamlined deployment on Vercel.

---

### ADR-002: Supabase Platform (PostgreSQL, GoTrue Auth, S3-Compatible Storage)
- **Status:** Approved
- **Context:** The platform requires relational data integrity (students, companies, jobs, applications), secure role-based authentication, private storage for PDF resumes, and strong multi-tenant authorization.
- **Decision:** Use Supabase with native PostgreSQL, Supabase Auth, and Supabase Storage.
- **Alternatives Considered:**
  - *Custom Express + MongoDB:* No native relational integrity, messy referential joins for complex placement queries, high maintenance overhead for custom auth.
  - *Firebase:* NoSQL document model is poorly suited for relational queries (e.g. eligibility filtering across complex academic criteria); vendor lock-in.
- **Consequences:** Rock-solid relational integrity with PostgreSQL, native Row Level Security (RLS), instant private bucket management for resumes, zero custom auth boilerplate to maintain.

---

### ADR-003: Tailwind CSS with Curated HSL Design Tokens
- **Status:** Approved
- **Context:** The portal requires a modern, bespoke, high-end SaaS visual identity (not a generic template). CSS maintenance must scale without style collisions.
- **Decision:** Use Tailwind CSS with custom HSL token variables (supporting light/dark mode, WCAG 2.1 AA contrast, and consistent spacing/elevation).
- **Alternatives Considered:**
  - *Bootstrap / Vanilla CSS:* Dated aesthetics, bloated bundle sizes, prone to styling collisions.
  - *Chakra UI / MUI:* Heavy runtime style overhead, restrictive design idioms.
- **Consequences:** Ultra-fast rendering with zero runtime CSS-in-JS overhead, complete control over design tokens, seamless responsive design.

---

### ADR-004: Server-Side RBAC Enforcement & PostgreSQL Row Level Security (RLS)
- **Status:** Approved
- **Context:** Academic placement data is sensitive. Client-side route guards alone are vulnerable to tampering or bypass.
- **Decision:** Implement multi-layered authorization: Next.js middleware + Server Action guards + PostgreSQL RLS policies.
- **Alternatives Considered:**
  - *Client-only guards (React Router guards):* High security risk; APIs remain exposed if direct requests are crafted.
- **Consequences:** Zero-trust architecture. Even if a client bypasses UI checks, database and API layers reject unauthorized requests.

---

### ADR-005: Playwright for Cross-Browser E2E Testing
- **Status:** Approved
- **Context:** Critical placement workflows (student application, recruiter shortlisting, admin approvals) involve complex state transitions across multiple roles and responsive viewports (mobile, tablet, desktop).
- **Decision:** Standardize on Playwright for end-to-end testing, alongside Vitest for unit tests.
- **Alternatives Considered:**
  - *Cypress:* Slower execution, weaker multi-tab and iframe handling.
  - *Selenium:* Heavyweight, high maintenance overhead.
- **Consequences:** Fast parallel test runs, built-in viewport emulation (375px, 768px, 1440px), visual regression and axe-core accessibility validation.

---

### ADR-006: Complete Greenfield Architecture over Legacy Prototype
- **Status:** Approved
- **Context:** The legacy codebase (`Smart-Placement-Assistant`) consisted of scattered HTML files (`index.html`, `admin-dashboard.html`) and an ad-hoc Node/Express script lacking type safety, relational normalization, modern security, and responsive polish.
- **Decision:** Execute a 100% greenfield rebuild with clean architecture, strict documentation, and modern component boundaries. Do not copy or reuse legacy prototypes.
- **Alternatives Considered:**
  - *Incremental refactoring of legacy files:* High technical debt, legacy spaghetti code, high risk of security flaws.
  - *Consequences:* Clean start, enterprise code quality, maintainable modular structure.

---

### ADR-007: Future AI Extensibility via Decoupled Service Layer
- **Status:** Approved
- **Context:** Future phases will introduce AI resume parsing, candidate matching, and placement assistants. Core placement operations must not depend on AI availability.
- **Decision:** Encapsulate core workflows in standard service contracts (`src/services/`). Future AI modules will consume these contracts as non-blocking enhancements.
- **Alternatives Considered:**
  - *Coupling AI into MVP application lifecycle:* Unnecessary cost, prompt latency risks, complexity overhead for MVP.
- **Consequences:** Core MVP is fast, deterministic, and dependable, while leaving clear hooks for Phase 19 AI capabilities.

---

### ADR-008: Git Environment Handling & Initial Commit Preparedness
- **Status:** Documented / Action Item for User
- **Context:** `git` is currently not recognized as an installed command in the host environment's PATH. An initial attempt to install Git via winget required administrator elevation, and a download attempt was rejected.
- **Decision:** All `.gitignore`, repository scaffolding, documentation, and task records are prepared. As soon as the user installs Git for Windows or adds `git.exe` to their system PATH, running `git init`, `git add .`, and `git commit -m "feat: initialize greenfield documentation and foundation"` will finalize the initial commit.
- **Alternatives Considered:** Running non-elevated background installers without permission was discarded in accordance with safety guidelines.
- **Consequences:** Safe, transparent execution with no unauthorized system modifications.

---

### ADR-009: Version-Controlled SQL Migrations (`supabase/migrations/`)
- **Status:** Approved
- **Context:** The database schema must be reproducible, version-controlled, auditable, and easily deployable across local, staging, and production environments.
- **Decision:** Standardize on timestamped declarative SQL migrations stored in `supabase/migrations/` managed via the Supabase CLI. Prohibit manual ad-hoc SQL modifications on production instances.
- **Alternatives Considered:**
  - *Prisma / Drizzle ORM migrations:* Added layer of abstraction with extra runtime dependencies and potential sync drift with native PostgreSQL RLS policies.
- **Consequences:** Direct native PostgreSQL capabilities (RLS, triggers, custom functions) are fully accessible without ORM limitations.

---

### ADR-010: Generated TypeScript Database Contract (`database.types.ts`)
- **Status:** Approved
- **Context:** Full-stack TypeScript requires compile-time safety when performing queries, inserts, and updates against Supabase tables.
- **Decision:** Maintain `src/types/database.types.ts` generated via `supabase gen types typescript`. Generics bind directly to `createBrowserClient<Database>`, `createServerClient<Database>`, and `createAdminSupabaseClient<Database>`.
- **Alternatives Considered:**
  - *Manually hand-crafting query response types:* Error-prone, drifts quickly as schema evolves.
- **Consequences:** Zero runtime overhead, instant compile-time error detection if table schemas change.

---

### ADR-011: Strict Multi-Tier Supabase Client Architecture
- **Status:** Approved
- **Context:** Leaking the Supabase Service Role key or misconfiguring cookie session persistence causes catastrophic security vulnerabilities or session loss in Next.js App Router.
- **Decision:** Explicitly separate client factories:
  - `src/lib/supabase/client.ts`: Browser only, anon key only.
  - `src/lib/supabase/server.ts`: Server Components & Actions, forwards cookies via `next/headers`.
  - `src/lib/supabase/admin.ts`: Server only, service role key with runtime assertion `typeof window === 'undefined'`.
  - `src/lib/supabase/middleware.ts`: Token refresh at Edge.
- **Alternatives Considered:**
  - *Single shared client:* Incompatible with Next.js SSR cookie lifecycle and risks bundling private keys to client.
- **Consequences:** Enforces zero-trust boundaries at compile and runtime.

---

### ADR-012: Server Actions & Zod Schema Validation for Authentication
- **Status:** Approved
- **Context:** Form submissions must be resilient, type-safe, accessible without client-side JavaScript dependency where possible, and strictly validated before touching backend auth APIs.
- **Decision:** Implement user login, registration, and logout via Next.js Server Actions backed by strict Zod schema parsing and the centralized `authService`. Session cookies are set and cleared securely server-side.
- **Alternatives Considered:**
  - *Client-side direct Supabase SDK login:* Bypasses server-side schema validation; requires client-side cookie manipulation or token storage.
  - *Express-style custom REST API endpoints (`/api/login`):* More boilerplate; separate request-response synchronization.
- **Consequences:** Clean type inference from Zod schemas to form states; automatic CSRF mitigation via Next.js Server Actions; server-side cookie attachment.

---

### ADR-013: Server-Authoritative RBAC & Anti-Tampering Security
- **Status:** Approved
- **Context:** The portal serves three primary roles (`student`, `company`, `admin`). Academic records, corporate postings, and administrative oversight must be isolated. Client-side route guards, localStorage values, or client metadata tampering must never grant elevated privileges.
- **Decision:**
  1. Authoritative Role Hierarchy: Evaluates `user.app_metadata.role` first (set via Admin API), then queries `public.users.role`, and falls back to `user_metadata.role` ONLY for unprivileged sign-ups (`student`, `company`).
  2. Anti-Tamper Barrier: Any claim of `role === 'admin'` in `user_metadata` is explicitly rejected as unverified and yields `null`.
  3. Defense-in-Depth Enforcement: Edge Middleware guards `/student/*`, `/company/*`, `/admin/*` via HTTP redirects (`/login` for unauthenticated, `/unauthorized` for role mismatches), while Server Components call `rbacService.requireStudent()`, `rbacService.requireCompany()`, and `rbacService.requireAdmin()` before rendering.
  4. Standard 403 Experience: Dedicated `/unauthorized` page presents accessible, professional denial guidance without leaking internal database or route internals.
- **Alternatives Considered:**
  - *Client-only guards:* Discarded due to vulnerability to URL tampering and localStorage spoofing.
  - *Trusting arbitrary user_metadata:* Discarded to prevent self-promotion to `admin`.
- **Consequences:** Zero-trust security guarantee across direct URL navigation, browser refresh, and client manipulation attempts.

---

### ADR-014: Normalized Student Profile Sub-Collections & Server Action Data Layer
- **Status:** Approved
- **Context:** Student profiles contain personal information, academic credentials, and multiple variable-length collections (skills, projects, certifications, achievements). Placing all attributes into an unvalidated JSON column prevents efficient SQL filtering, automated eligibility verification (e.g. querying students by specific skill or certification), and database constraints.
- **Decision:**
  1. Relational Normalization: Separate tables `student_skills`, `student_projects`, `student_certifications`, and `student_achievements` linked via foreign key to `student_profiles(id) ON DELETE CASCADE`.
  2. Server-Authoritative User Identity: Next.js Server Actions derive `userId` strictly from verified server session (`rbacService.requireStudent()`), preventing client ID tampering.
  3. Strict Zod Schema & Protocol Validation: Phone numbers, CGPA (0.00-10.00), graduation batch years, and URLs (strictly validating `http:` or `https:`) are checked before persistence.
  4. Profile Photo Foundation: 2MB size limit, strictly validated MIME types (`image/jpeg`, `image/png`, `image/webp`), and scoped user paths in Supabase Storage (`avatars/${userId}/...`).
- **Alternatives Considered:**
  - *Single JSONB column:* Discarded to preserve relational integrity and database constraints.
  - *Trusting client-supplied student ID:* Discarded to eliminate authorization bypass vulnerabilities.
- **Consequences:** High-fidelity data structures ready for future eligibility evaluation, resume extraction, and recruiter search queries.

---

### ADR-015: Normalized Company Profile & Recruiter Association Architecture
- **Status:** Approved
- **Context:** An organization may have multiple recruiters, hiring managers, or talent acquisition representatives. Modeling company data by attaching corporate fields directly to individual user accounts causes data duplication, update anomalies, and makes organization-wide collaboration on campus drives impossible.
- **Decision:**
  1. Entity Separation: Model `companies` as an independent organizational entity and `company_users` as the mapping table linking authenticated user accounts (`public.users`) to `companies` with role permissions (`owner`, `recruiter`, `hiring_manager`).
  2. Single Primary Organization Binding: Constrain `company_users(user_id)` with a unique constraint so an individual recruiter account maps deterministically to their primary organization.
  3. Server-Authoritative Identity: Server Actions and `companyService` derive `userId` strictly from the verified session (`rbacService.requireCompany()`), preventing unauthorized modifications across corporate tenants.
  4. First-Time Setup UX: Recruiter accounts without an associated company profile receive a dedicated first-time setup state explaining platform benefits and leading directly to profile initialization.
- **Alternatives Considered:**
  - *Direct 1:1 user-to-company without mapping table:* Prevents future multi-recruiter corporate accounts.
  - *Storing company data in auth user_metadata:* Discarded due to lack of relational integrity, search indexing, and security policies.
- **Consequences:** Scalable enterprise foundation ready for future multi-recruiter workflows, job postings, and university administrator verification.

---

### ADR-016: Normalized Job Posting Schema & Controlled Lifecycle State Machine
- **Status:** Approved
- **Context:** Campus placement drives require structured academic eligibility gating (min CGPA, allowed departments, active backlogs, batch years), compensation packages, and strict publication lifecycles. Allowing arbitrary job modifications, deletion of live drives, or client-provided tenant identifiers creates security risks and audit integrity failures.
- **Decision:**
  1. Relational Job Schema: Model `jobs` as an independent entity linked via foreign key to `companies(id) ON DELETE RESTRICT` and `users(id) ON DELETE SET NULL` for auditability.
  2. Controlled Status State Machine: Enforce discrete lifecycle states (`draft` -> `published` -> `closed` -> `archived`). Only draft jobs may be hard deleted; published jobs cannot have deadlines in the past.
  3. Server-Authoritative Identity: Server Actions and `jobService` resolve `company_id` strictly via server session lookup (`company_users`), ignoring any client-provided company IDs.
  4. Multi-Tenant RLS Policies: Recruiters can view/manage only their company's jobs; students and public can view only published, admin-approved jobs with active deadlines.
- **Alternatives Considered:**
  - *Unstructured JSON eligibility criteria:* Prevents database-level indexing and SQL filtering.
  - *Client-supplied company_id:* Discarded to prevent cross-tenant tampering.
- **Consequences:** Robust, high-integrity placement drive foundation ready for student discovery (Phase 7) and candidate pipeline management (Phase 8).

---

### ADR-017: Centralized Academic Eligibility Engine & Student Job Discovery
- **Status:** Approved
- **Context:** Students discovering placement drives need instantaneous clarity on whether their verified academic record (CGPA, active backlogs, department/branch, graduation year) satisfies the employer's screening requirements. Fragmenting this logic across individual components risks inconsistent evaluation or unauthorized application submission.
- **Decision:**
  1. Centralized Reusable Engine (`src/services/eligibility.service.ts`): Provide a pure, deterministic `evaluateJobEligibility(student, job)` evaluator returning itemized pass/fail results for CGPA, backlogs, department, and batch year.
  2. Server-Enforced Student Route: Guard `/student/jobs` and `/student/jobs/[jobId]` exclusively with `rbacService.requireStudent()`, blocking unauthenticated users and other roles.
  3. Filtered Discovery Scope: Display only jobs with `status = 'published'` and `application_deadline > now()`, strictly excluding drafts, closed, archived, or expired drives.
  4. Multi-Dimensional Search & Filtering: Support text search (role, company, department, skills), faceted filtering (employment type, workplace mode, branch, cohort), and personalized "Show Only Roles I Am Eligible For".
  5. Decoupled Application CTA: Render an informative phase placeholder modal for "Apply Now" to preserve pipeline boundaries without generating fake application records ahead of Phase 8.
- **Alternatives Considered:**
  - *Ad-hoc client component eligibility calculation:* Discarded to avoid divergence between discovery cards, detail views, and future application validation.
  - *Pre-filtering jobs entirely at database query time:* Discarded because students should still be able to discover all published opportunities and understand their specific eligibility gaps.
- **Consequences:** Highly transparent, performant student experience adhering strictly to enterprise placement platform guidelines and PRD requirements.

---

### ADR-018: Normalized Job Application Schema & Server-Authoritative Submission Engine
- **Status:** Approved
- **Context:** Students applying to placement drives must not be permitted to submit duplicate applications, apply to expired or draft drives, bypass academic eligibility gates by manipulating client-side state, or inject arbitrary student/company identifiers into application records.
- **Decision:**
  1. Normalized Relational Schema (`job_applications` & `application_status_history`): Applications are stored with foreign keys referencing `jobs(id)` and `student_profiles(id)` on delete restrict, backed by a database-level `UNIQUE(job_id, student_id)` constraint.
  2. Minimal Initial Status Lifecycle: The application status is constrained to `('applied', 'withdrawn', 'shortlisted', 'in_review', 'offered', 'rejected')` with the initial submission status locked to `'applied'`.
  3. Server-Authoritative Eligibility & Identity: `applicationService.submitApplication` derives candidate identity strictly from the verified session (`rbacService.requireStudent()`), re-checks that the job is published, verifies that `application_deadline > now()`, and executes `evaluateJobEligibility` before creating the application record.
  4. Audit Trail via Status History: Application creation atomically records an initial history entry in `application_status_history` recording the student user ID, timestamp, and submission remarks.
  5. Interactive Confirmation UI: `JobDetailView.tsx` renders a modal with candidate summary, optional cover note (max 2000 chars), live loading feedback, and transitions to a clear confirmation view with application reference ID and status badge.
- **Alternatives Considered:**
  - *Client-side eligibility trust:* Discarded to prevent browser tampering and invalid candidate entries.
  - *Allowing multiple applications per drive:* Discarded because college placement protocols permit exactly one active application per candidate per drive.
- **Consequences:** Reliable, tamper-proof application engine foundation fulfilling all Phase 8 prerequisites without scope creep into recruiter boards or notifications.

---

### ADR-019: Multi-Tenant Recruiter Applicant Isolation & Review Architecture
- **Status:** Approved
- **Context:** Recruiters reviewing applications must be strictly isolated to their own company's job postings. Allowing client-supplied company or job identifiers without server verification could permit Company A to view or manipulate Company B's candidate submissions.
- **Decision:**
  1. Server-Side Ownership Verification: Every query in `applicationService.getCompanyJobApplicants` and `applicationService.getApplicantDetails` verifies that the requested `jobId` belongs to the authenticated user's associated `companyId`.
  2. Strict RBAC Enforcement: The route `/company/jobs/[id]/applicants` is strictly guarded by `rbacService.requireCompany()`. Students, unauthenticated callers, or spoofed roles are redirected or rejected.
  3. Relational Candidate Enrichment: Applications are queried joining student profiles and nested sub-collections (skills, projects, certifications, achievements) for high-fidelity recruiter evaluation.
- **Alternatives Considered:**
  - *Client-supplied company ID filtering:* Discarded to prevent cross-tenant data leaks.
- **Consequences:** Secure, multi-tenant candidate review pipeline adhering to enterprise isolation standards.

---

### ADR-020: Server-Authoritative Pipeline Transitions & Terminal Lifecycle Engine
- **Status:** Approved
- **Context:** Recruiter candidate status transitions must follow a deterministic, auditable hiring pipeline. Arbitrary status transitions (e.g. stage skipping from `applied` to `offered`, reverting from `in_review` back to `applied`, or modifying candidate-withdrawn applications) violate campus placement governance and audit integrity.
- **Decision:**
  1. Centralized Transition Engine (`src/features/applications/utils/transitions.ts`): Define canonical linear stages (`applied` -> `in_review` -> `shortlisted` -> `offered`) and terminal states (`offered`, `rejected`, `withdrawn`). Rejection is allowed from any active non-terminal stage. Terminal applications cannot be further transitioned. Withdrawn applications cannot be altered by recruiters.
  2. Server-Authoritative Execution: `applicationService.updateRecruiterApplicationStatus` validates requested status transitions server-side, deriving recruiter identity (`changed_by`) exclusively from the verified server session.
  3. Immutable Audit Logging: Every successful transition inserts exactly one `application_status_history` record containing `from_status`, `to_status`, `changed_by`, `remarks`, and `created_at`.
  4. Cache Revalidation Synchronization: Successfully transitioning candidate stages revalidates both the recruiter applicant board route (`/company/jobs/[id]/applicants`) and the student application tracker (`/student/applications`).
- **Alternatives Considered:**
  - *Client-side state management without server validation:* Discarded due to security vulnerability to arbitrary status injection.
  - *Allowing backward stage movement:* Discarded because college placement protocols require forward-only progression or explicit rejection.
- **Consequences:** Deterministic, tamper-proof candidate progression and pipeline automation with complete audit transparency.

