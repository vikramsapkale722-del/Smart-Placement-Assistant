# System Architecture Document
## Smart Placement Portal

---

### 1. Architectural Principles & Overview

The Smart Placement Portal is architected as a modern, decoupled, multi-tier web application built on **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL + Supabase Auth + Supabase Storage)**.

#### Core Architectural Tenets:
1. **Separation of Concerns:**
   - **UI Layer (`src/app`, `src/components`):** Pure presentation, interaction, and local client state. Free of database queries or direct backend business rules.
   - **Feature Modules (`src/features`):** Domain-driven components, hooks, and types organized by domain (auth, student, company, jobs, applications, admin).
   - **Service Layer (`src/services`):** Encapsulated business logic, validation, eligibility computation, and audit logging.
   - **Data Access Layer (`src/lib/supabase`):** Typed database client adapters, queries, and storage clients.
2. **Server-Side Enforcement (Zero Client Trust):**
   - All authorization checks (RBAC), data mutations, eligibility verification, and file upload validations MUST occur server-side (Next.js Server Components, Server Actions, and Route Handlers) combined with PostgreSQL Row Level Security (RLS).
3. **Extensibility for Future AI:**
   - The data model and service contracts are decoupled such that future AI services (Resume parsing, Interview preparation, Placement Copilot) can plug in via dedicated service interfaces without destabilizing core transactional workflows.

---

### 2. High-Level System Architecture & Flow

```
User (Browser)
    │
    ▼
Next.js Client Tier (Client Components / Islands)
    │ HTTPS / Server Actions
    ▼
Next.js Server Tier (Server Components, Actions, Route Handlers)
    │
    ▼
Service Layer (`src/services/*`)
    │
    ▼
Supabase Integration Layer (`src/lib/supabase/*`)
    │
    ▼
Supabase Platform (GoTrue Auth, Storage, PostgreSQL with RLS)
```

#### Layer Responsibilities & Authorization Boundaries:

1. **Client Tier (`src/app`, `src/components`):**
   - **Responsibilities:** User interaction, client-side validation feedback, responsive UI state, optimistic updates, skeleton rendering.
   - **Boundary:** Possesses only `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Zero authority to make authorization determinations or perform unauthenticated database writes.

2. **Server Tier (`src/app/api`, Server Actions, Middleware):**
   - **Responsibilities:** Edge session validation, HTTP cookie management, role assertion guards (`requireRole(['admin'])`), server-side Zod validation.
   - **Boundary:** Extracts verified user identity via Supabase JWT from secure HttpOnly cookies. Rejects unauthorized actions with 401/403 before invoking the service layer.

3. **Service Layer (`src/services/*`):**
   - **Responsibilities:** Pure business logic encapsulation (eligibility calculation engine, application lifecycle state machine, audit log dispatch).
   - **Boundary:** Framework-agnostic domain logic. Does not directly manipulate HTTP cookies or render UI.

4. **Database Tier (Supabase PostgreSQL with RLS):**
   - **Responsibilities:** ACID data storage, relational integrity constraints, automated timestamp triggers (`handle_updated_at`), declarative Row Level Security.
   - **Boundary:** Final defense layer. Even if server assertions were bypassed, PostgreSQL RLS rejects unauthorized queries directly at the database engine level.

---

### 3. Layered Architecture Details

#### 3.1 Frontend Architecture (`src/app`, `src/components`, `src/features`)
- **Routing Strategy:** Next.js App Router with Route Groups:
  - `(auth)`: Login, registration, password recovery, verification pending.
  - `(student)`: Student dashboard, profile editor, job listings, application status tracker.
  - `(company)`: Recruiter dashboard, company profile, drive creation, applicant review.
  - `(admin)`: Administrative dashboard, student/company verification, audit logs, reports.
- **Component Hierarchy:**
  - **Atoms/Primitives (`src/components/ui`):** Button, Input, Select, Badge, Card, Modal, Table, Tabs, Skeleton.
  - **Layout Components (`src/components/layout`):** AppNavbar, AppSidebar, PageHeader, DashboardShell, Container.
  - **Domain Features (`src/features/*`):** Self-contained slices combining UI, hooks, and client-side view models.

#### 3.2 Backend & Service Layer Architecture (`src/services`)
- **Stateless Server Execution:** Server Actions and API Route Handlers execute stateless request cycles.
- **Business Logic Isolation:**
  ```typescript
  // Example Service Layer Abstraction:
  export interface EligibilityResult {
    isEligible: boolean;
    reasons: string[];
    criteria: {
      cgpaMet: boolean;
      branchMet: boolean;
      backlogsMet: boolean;
      graduationYearMet: boolean;
    };
  }
  ```
- **Service Registry:**
  - `src/services/auth.service.ts`: User session validation, role resolution, invitation handling.
  - `src/services/student.service.ts`: Academic profile aggregation, verification status, resume metadata.
  - `src/services/job.service.ts`: Job lifecycle (draft -> published -> closed), search queries, filter pipelines.
  - `src/services/eligibility.service.ts`: Algorithmic evaluation of student credentials vs job requirements.
  - `src/services/application.service.ts`: Transactional application creation, stage progressions, withdraw requests.
  - `src/services/audit.service.ts`: Structured audit event creation for sensitive administrative operations.

#### 3.3 Database & RLS Architecture (`src/lib/supabase`)
- **Direct Database Client Access:**
  - `createServerSupabaseClient()`: Used in Server Components and Server Actions; enforces user JWT context so PostgreSQL RLS policies apply automatically.
  - `createAdminSupabaseClient()`: Restricted exclusively to privileged background tasks or verified admin service operations (using `SUPABASE_SERVICE_ROLE_KEY` which is NEVER exposed to the browser).
- **Row Level Security (RLS):**
  - Every table has RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
  - Policies enforce data tenancy: students can only read/write their own records; companies can only view their own listings and applicants to their listings; admins have verified elevated access.

#### 3.4 Storage Architecture
- **Bucket Configuration:**
  - `resumes`: Private bucket. Students upload PDF files up to 5MB. Path structured as: `resumes/{user_id}/{timestamp}_{filename}.pdf`.
  - Recruiter/Admin access to resumes is served via short-lived signed URLs (TTL: 15 minutes) generated server-side after verifying authorization.
  - `company-logos`: Public or signed asset bucket for company branding (PNG, JPG, WebP up to 2MB).

---

### 4. Error Handling & Defensive Programming Strategy
1. **Centralized Error Wrapper:**
   - Standardized application error format: `{ success: boolean; data?: T; error?: { code: string; message: string; details?: any } }`.
2. **Defensive Boundaries:**
   - Next.js `error.tsx` at route segment levels to prevent cascading page crashes.
   - Fallback empty states for lists with zero items.
   - Skeletons with matching geometry to minimize layout shift (CLS).
3. **Form Validation:**
   - Schema validation with `Zod` across both client forms and server actions, ensuring complete parity and sanitization.

---

### 5. Deployment & DevOps Architecture
- **Hosting Environment:** Vercel (Edge network + Node.js serverless functions).
- **Database Infrastructure:** Supabase Managed PostgreSQL (AWS Frankfurt / Mumbai region depending on college location).
- **Environment Segmentation:**
  - `Local`: Developer workstation with local `.env.local`.
  - `Preview`: Ephemeral staging environments generated automatically on Pull Requests.
  - `Production`: Main branch automated deployment with branch protection and strict CI test pass gates.
