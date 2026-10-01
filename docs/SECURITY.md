# Security Architecture & Policies
## Smart Placement Portal

---

### 1. Security Philosophy: Defense-in-Depth

The Smart Placement Portal handles sensitive student academic records, personal contact data, resume documents, company hiring strategies, and institutional placement statistics. The system operates on a **zero-trust client architecture**:

> **Rule:** Never trust any data or claim originating from the client browser. All authentication, authorization, role membership, eligibility calculations, and file integrity checks MUST be verified server-side.

---

### 2. Authentication & Session Management

1. **Authentication Engine:**
   - Supabase Auth (GoTrue) utilizing industry-standard bcrypt/Argon2 password hashing, secure JWTs, and refresh tokens.
2. **Session Persistence:**
   - Tokens stored exclusively in **`HttpOnly`**, **`Secure`**, **`SameSite=Lax`** cookies via Next.js Middleware.
   - Absolutely no JWT storage in `localStorage` or `sessionStorage` (mitigating XSS token theft).
3. **Session Validation & Invalidation:**
   - Active session verification on every non-static server request via `supabase.auth.getUser()`.
   - Explicit session destruction and cookie clearing on logout.

---

### 3. Role-Based Access Control (RBAC)

#### 3.1 Roles Definition
1. `student`: Enrolled candidate seeking internships or campus placements.
2. `company`: Recruiter representing a registered corporate entity.
3. `admin`: Verified placement cell coordinator or institutional official.

#### 3.2 Enforcement Layers
- **Layer 1: Edge / Next.js Middleware (`src/middleware.ts`):**
  - Inspects user role from authenticated session.
  - Redirects unauthorized routes immediately (e.g. non-admin attempting `/admin/*` is redirected with 403 / login redirect).
- **Layer 2: Server Action / Route Handler Authorization Guard:**
  - Before performing any business logic, every Server Action invokes an authorization assertion:
    ```typescript
    // Example:
    const user = await requireRole(['admin']);
    ```
- **Layer 3: PostgreSQL Row Level Security (RLS):**
  - Even if server-level checks were somehow bypassed, PostgreSQL policies reject unauthorized queries directly at the database engine level.

---

### 4. Input Validation & Data Sanitization

1. **Strict Schema Validation:**
   - Every inbound payload (JSON body, form data, URL search params) is validated against a strict `Zod` schema.
   - Strip unknown properties by default (`.strict()`).
2. **SQL Injection Prevention:**
   - Supabase client uses parameterized queries exclusively. Direct string-concatenated SQL queries are strictly prohibited.
3. **Cross-Site Scripting (XSS) Mitigation:**
   - React's default output encoding protects HTML rendering.
   - Plain text inputs are sanitized. Rich text / markdown descriptions for job postings are sanitized using DOMPurify with strict HTML tag whitelists before rendering.

---

### 5. File Upload & Storage Security

1. **Bucket Configuration:**
   - Resumes bucket is strictly **Private**. Direct public access is disabled.
2. **File Restrictions:**
   - Allowed MIME types: `application/pdf` only.
   - Maximum file size: `5 MB` enforced both on client preview and strictly on server upload handler.
   - Magic byte header inspection (verifying `%PDF-` header) to prevent malicious executable files disguised as PDFs.
3. **Storage Access Control:**
   - Access to student resumes is granted only via short-lived signed URLs (15-minute expiration) generated on the server after verifying the requesting user is the student themselves, a verified recruiter for a job the student applied to, or an admin.

---

### 6. Secrets Management & Environment Security

1. **Separation of Keys:**
   - `NEXT_PUBLIC_SUPABASE_URL`: Public endpoint.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Safe for client initialization (strictly governed by RLS).
   - `SUPABASE_SERVICE_ROLE_KEY`: Privileged master key. **NEVER** exposed to client bundles, **NEVER** prefixed with `NEXT_PUBLIC_`, used strictly in isolated server tasks.
2. **Repository Hygiene:**
   - `.env`, `.env.local`, `.env.production` are strictly listed in `.gitignore`.
   - `.env.example` contains placeholders only.
   - Pre-commit scanning for potential secret leaks.

---

### 7. Audit Logging & Compliance

1. **Immutable Audit Trail:**
   - Key operations are persisted to the `audit_logs` table:
     - Student academic data verification
     - Student profile status updates
     - Recruiter job status modifications (draft -> published -> closed)
     - Application status progressions (offer, rejection)
     - Administrative overrides
2. **Log Metadata:**
   - Includes timestamp, actor ID, action type, target entity, target ID, and client IP hash.

---

### 8. Defensive Error Handling

1. **Information Leakage Prevention:**
   - Production error responses never return raw stack traces, database table names, or internal system paths.
   - User-facing error messages are sanitized and mapped to user-friendly messages:
     ```json
     {
       "success": false,
       "error": {
         "code": "ELIGIBILITY_CRITERIA_NOT_MET",
         "message": "Your current CGPA does not meet the minimum requirement for this drive."
       }
     }
     ```
