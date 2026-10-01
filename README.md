# Smart Placement Portal
> Enterprise-grade College Placement Management Platform connecting Students, Recruiters, and Placement Administrators.

---

## 🌟 Overview

The **Smart Placement Portal** is a production-grade, secure, responsive, and accessible web application designed to streamline campus recruitment. It replaces fragmented legacy processes with a unified platform for student profile management, drive postings, automatic eligibility checking, application pipelines, and institutional accreditation reporting.

This project is a complete **Greenfield Rebuild** engineered with a clean, layered architecture and modern SaaS design principles.

---

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Server Actions, React Server Components)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom HSL token design system
- **Backend / Database:** [Supabase](https://supabase.com/) (Managed PostgreSQL, Row Level Security)
- **Authentication:** Supabase Auth (GoTrue) with secure HttpOnly cookies
- **Storage:** Supabase Storage (Private S3-backed buckets for PDF resumes)
- **Validation:** [Zod](https://zod.dev/)
- **Testing:** [Playwright](https://playwright.dev/) (End-to-End & cross-device) & Vitest (Unit/Integration)
- **Deployment:** [Vercel](https://vercel.com/)

---

## 👥 User Roles & Core Capabilities

### 🎓 1. Student
- Register and manage complete academic profile (CGPA, branch, batch, 10th/12th marks, active backlogs).
- Upload and manage verified PDF resumes (up to 5MB).
- Discover active campus drives with instant eligibility feedback (criteria met vs unmet).
- 1-click application submission with resume snapshot.
- Real-time application tracking across recruitment stages.

### 🏢 2. Company / Recruiter
- Company profile management with logo, overview, and verified recruiter contacts.
- Create and publish job/internship drives with custom eligibility criteria (CGPA, allowed branches, max backlogs, package CTC).
- Inbound applicant review board with CGPA sorting and secure resume preview.
- Manage candidate progression: `applied` → `shortlisted` → `interview` → `offered` → `rejected`.

### 🛡️ 3. Placement Administrator
- Executive placement dashboard with live institutional KPIs (placement %, average package, top recruiters).
- Student academic verification console (verify CGPA and resolve record discrepancies).
- Company and job posting moderation.
- Comprehensive CSV data exports for accreditation compliance (NAAC, NIRF).
- Immutable audit log monitoring.

---

## 📚 Project Documentation Suite

All architectural, security, and design specifications are cataloged in `/docs`:

- [PRD.md](docs/PRD.md) — Product Requirements Document (Scope, User Journeys, Business Rules)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Layered System Architecture & Service Patterns
- [DESIGN.md](docs/DESIGN.md) — Design System (HSL Tokens, Typography, Spacing, Component Guidelines)
- [DATABASE.md](docs/DATABASE.md) — Normalized PostgreSQL Schema, Constraints, and RLS Policies
- [SECURITY.md](docs/SECURITY.md) — Zero-Trust Security, RBAC, File Upload Rules, and Secrets Protection
- [TEST_PLAN.md](docs/TEST_PLAN.md) — Comprehensive Test Plan (Unit, Responsive 375px/768px/1440px, E2E)
- [DECISIONS.md](docs/DECISIONS.md) — Architecture Decision Records (ADRs)
- [MEMORY.md](docs/MEMORY.md) — Project State, Active Decisions, and Execution History
- [MASTER_ROADMAP.md](docs/MASTER_ROADMAP.md) — Full 20-Phase Master Implementation Roadmap
- [RULES.md](RULES.md) — 25 Non-Negotiable AI Development Rules
- [TASKS.md](TASKS.md) — Granular Task Breakdown

---

## 🚀 Getting Started (Phase 0 Status)

This repository is currently in **PHASE 0 (Foundation & Planning)**. Development strictly follows vertical slice implementation with single-task approvals.

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Environment Configuration
Copy the template environment file:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## 🔒 Security & Quality Standards
- **Zero Client Trust:** All authorization assertions and eligibility checks run server-side.
- **Strict RLS:** PostgreSQL Row Level Security enabled on all application tables.
- **Accessibility:** Built according to WCAG 2.1 AA specifications.
- **Responsive Design:** Verified at 375px (mobile), 768px (tablet), and 1440px (desktop).
