# Database Architecture & PostgreSQL Schema Specifications
## Smart Placement Portal

---

### 1. Database Platform & Overview
- **Database Engine:** PostgreSQL 15+ (Hosted via Supabase Managed Infrastructure).
- **Architecture Tenet:** Strictly relational, normalized (3NF), ACID-compliant, with declarative Row Level Security (RLS) policies.
- **Current Status (Phase 7 / TASK-010):**
  - Base extensions migration: `supabase/migrations/20260929000000_init_extensions.sql`.
  - Student profile migration: `supabase/migrations/20260929000001_student_profile_foundation.sql` (`users`, `student_profiles`, `student_skills`, `student_projects`, `student_certifications`, `student_achievements`).
  - Company profile migration: `supabase/migrations/20260929000002_company_profile_foundation.sql` (`companies`, `company_users`).
  - Job posting foundation migration: `supabase/migrations/20260929000003_jobs_foundation.sql` (`jobs`).
  - Type-safe database contract maintained in `src/types/database.types.ts`.
  - Application business tables for job applications and status progression will be added in Phase 8.

---

### 2. PostgreSQL Strategy
1. **Relational Integrity Over App Logic:** Rely on database constraints (`CHECK`, `UNIQUE`, `FOREIGN KEY ... ON DELETE`) rather than purely client-side validation.
2. **Deterministic Data Types:** Explicit column widths, numeric scales for CGPA and monetary packages, ISO-8601 timestamps with timezones (`TIMESTAMPTZ`).
3. **Automated Timestamping:** Every mutable table binds to the trigger function `public.handle_updated_at()`.

---

### 3. Supabase Integration Architecture
- **Client/Server Separation:**
  - **Browser Client (`src/lib/supabase/client.ts`):** Initialized via `@supabase/ssr` with public anon key. Strictly governed by user session JWT and database RLS.
  - **Server Client (`src/lib/supabase/server.ts`):** Used in Server Components, Server Actions, and Route Handlers. Automatically forwards session cookies via Next.js `cookies()`.
  - **Middleware Handler (`src/lib/supabase/middleware.ts`):** Refreshes authentication tokens at the Edge and syncs cookies before reaching server components.
  - **Admin Client (`src/lib/supabase/admin.ts`):** Uses `SUPABASE_SERVICE_ROLE_KEY`. Restricted exclusively to server execution (never bundled to browser); bypasses RLS for scheduled jobs and administrative tasks.

---

### 4. Entity Overview (Planned & Created Tables)

| Entity / Table Name | Purpose | Primary Key | Critical Foreign Keys | Ownership / RLS Boundary |
| :--- | :--- | :--- | :--- | :--- |
| `public.users` | Portal identity & role mapping | `UUID` (maps to `auth.users.id`) | `auth.users(id)` | User self / Admin |
| `student_profiles` | Academic & verification records | `UUID` | `users(id)` | Student self / Admin / Applied Recruiters |
| `student_skills` | Normalized skills & proficiencies | `UUID` | `student_profiles(id)` | Student self / Admin / Applied Recruiters |
| `student_projects` | Student project portfolio records | `UUID` | `student_profiles(id)` | Student self / Admin / Applied Recruiters |
| `student_certifications` | Technical & industry credentials | `UUID` | `student_profiles(id)` | Student self / Admin / Applied Recruiters |
| `student_achievements` | Competitions, honors & awards | `UUID` | `student_profiles(id)` | Student self / Admin / Applied Recruiters |
| `resumes` | Uploaded PDF resume metadata | `UUID` | `student_profiles(id)` | Student self / Admin / Applied Recruiters |
| `companies` | Corporate hiring partner profile | `UUID` | None | Company recruiters / Admin |
| `company_users` | Recruiter-to-company association | `UUID` | `companies(id)`, `users(id)` | Recruiter self / Admin |
| `jobs` | Drive/internship postings & eligibility | `UUID` | `companies(id)`, `users(id)` | Company recruiters / Admin / Public (if published) |
| `job_applications` | Student drive applications | `UUID` | `jobs(id)`, `student_profiles(id)`, `resumes(id)` | Student applicant / Job recruiter / Admin |
| `application_status_history` | Audit log of candidate progression | `UUID` | `job_applications(id)`, `users(id)` | Student applicant / Job recruiter / Admin |
| `audit_logs` | Platform administrative audit trail | `UUID` | `users(id)` | Admin only |

---

### 5. Entity Relationships & Dependency Flow

```
auth.users (Supabase Managed Identity)
    │ 1:1
    ▼
public.users (Role: 'student' | 'company' | 'admin')
    ├── 1:1 ──► student_profiles
    │               ├── 1:N ──► student_skills
    │               ├── 1:N ──► student_projects
    │               ├── 1:N ──► student_certifications
    │               ├── 1:N ──► student_achievements
    │               ├── 1:N ──► resumes
    │               └── 1:N ──► job_applications ◄── N:1 ── jobs ◄── 1:N ── companies
    │                                    │                                      ▲
    │                                    └── 1:N ──► application_status_history │
    │                                                                           │
    └── 1:N ──► company_users ──────────────────────────────────────────────────┘
```

---

### 6. Naming Conventions
- **Tables & Views:** `snake_case`, pluralized (e.g., `student_profiles`, `jobs`, `audit_logs`).
- **Columns:** `snake_case`, concise nouns/adjectives (e.g., `min_cgpa`, `active_backlogs`, `created_at`).
- **Primary Keys:** Standardized as `id` of type `UUID`.
- **Foreign Keys:** `<singular_entity>_id` (e.g., `student_id`, `company_id`, `job_id`).
- **Boolean Columns:** Prefixed with `is_` or `has_` (e.g., `is_verified`, `is_approved_by_admin`, `is_primary`).
- **Timestamps:** Suffixed with `_at` with type `TIMESTAMPTZ` (e.g., `created_at`, `updated_at`, `applied_at`).

---

### 7. Primary Key Strategy
- All primary keys use universally unique identifiers (`UUID`) generated using `gen_random_uuid()` or `uuid_generate_v4()`.
- Prevents sequential ID guessing / enumeration attacks on student profiles, job postings, and application documents.

---

### 8. Foreign Key & Referential Action Strategy
- **Cascading Deletions:**
  - Deleting an `auth.user` cascades down to `public.users` and their respective `student_profiles` or `company_users`.
  - Deleting a `student_profile` cascades to their `student_skills` and `resumes`.
- **Restricted Deletions (`ON DELETE RESTRICT`):**
  - A `job` CANNOT be deleted if `job_applications` reference it (preserves academic application history).
  - A `student_profile` CANNOT be hard-deleted if active `job_applications` exist.
  - A `company` CANNOT be deleted if it has existing `jobs`.

---

### 9. Indexing Strategy
1. **Foreign Key Indexes:** Explicit B-Tree indexes on every foreign key column to optimize joins.
2. **Filter & Status Indexes:**
   - `idx_jobs_status_deadline`: `(status, application_deadline)` — powers active drive feeds.
   - `idx_applications_job_status`: `(job_id, status)` — powers recruiter applicant review boards.
   - `idx_student_profiles_cgpa`: `(cgpa)` — powers eligibility evaluations.
3. **Compound Search Indexes:**
   - `idx_student_profiles_dept_batch`: `(department, batch_year)` — powers department-specific eligibility checks.

---

### 10. Constraint Strategy
- **Academic Validations:**
  - `cgpa`: `NUMERIC(4,2) CHECK (cgpa >= 0.0 AND cgpa <= 10.0)`
  - `tenth_percentage`, `twelfth_percentage`: `NUMERIC(5,2) CHECK (percentage >= 0.0 AND percentage <= 100.0)`
  - `active_backlogs`: `INTEGER CHECK (active_backlogs >= 0)`
- **Business Logic Uniqueness:**
  - `UNIQUE(job_id, student_id)` on `job_applications` (prevents double applications).
  - `UNIQUE(student_id, name)` on `student_skills` (prevents duplicate skill entries).
  - `UNIQUE(company_id, user_id)` on `company_users`.

---

### 11. Row Level Security (RLS) Strategy

Row Level Security is mandatory on every table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

#### Declarative Policies by Domain:
1. **`users` Table:**
   - `SELECT`: `auth.uid() = id OR is_admin()`
   - `UPDATE`: `auth.uid() = id OR is_admin()`
2. **`student_profiles` Table:**
   - `SELECT`: `auth.uid() = user_id OR is_admin() OR EXISTS (SELECT 1 FROM job_applications ja JOIN jobs j ON ja.job_id = j.id JOIN company_users cu ON j.company_id = cu.company_id WHERE ja.student_id = student_profiles.id AND cu.user_id = auth.uid())`
   - `INSERT / UPDATE`: `auth.uid() = user_id OR is_admin()`
3. **`jobs` Table:**
   - `SELECT`: `status = 'published' OR is_company_recruiter(company_id) OR is_admin()`
   - `INSERT / UPDATE`: `is_company_recruiter(company_id) OR is_admin()`
4. **`job_applications` Table:**
   - `SELECT`: `student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid()) OR is_company_recruiter_for_job(job_id) OR is_admin()`
   - `INSERT`: `student_id = (SELECT id FROM student_profiles WHERE user_id = auth.uid())`

---

### 12. Database Migration Strategy
- **Tooling:** Supabase CLI version-controlled SQL migrations located in `supabase/migrations/`.
- **Applied Migrations:**
  1. `20260929000000_init_extensions.sql` — Extensions & schema baseline.
  2. `20260929000001_student_profile_foundation.sql` — Student profile, academic credentials & portfolio tables.
  3. `20260929000002_company_profile_foundation.sql` — Company profile & recruiter associations.
  4. `20260929000003_jobs_foundation.sql` — Normalized jobs table with controlled status and academic eligibility parameters.
  5. `20260929000004_job_applications_foundation.sql` — Job applications with `UNIQUE(job_id, student_id)` constraint, status history audit trail, and RLS policies.
- **Principles:**
  - All migration files are immutable once applied to staging/production.
  - Schema changes are tested locally or on preview branches before merging to main.
  - Zero undocumented manual SQL queries in Supabase Dashboard in production.

---

### 13. Type Generation Strategy
- **Command:**
  ```bash
  npx supabase gen types typescript --project-id <project-ref> > src/types/database.types.ts
  ```
- **Workflow:** Whenever a migration is created or applied, the TypeScript types in `src/types/database.types.ts` are regenerated, ensuring 100% compile-time type safety across all queries, inserts, and updates.

---

### 14. Data Security & Operational Integrity
- **Secrets Isolation:** The `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to isolated server-side routines. Client code receives only the anonymous public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Audit Logging:** Every critical change (status updates, student credential approvals, job archiving) logs to `audit_logs` with actor ID, timestamp, and metadata snapshot.
- **Backups:** Supabase automated daily Point-in-Time Recovery (PITR) enabled in production.
