# Master Project Roadmap
## Smart Placement Portal

---

### Phase 0: Project Foundation & Greenfield Planning
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-000` | Create complete project documentation suite (`PRD`, `ARCHITECTURE`, `DESIGN`, `DATABASE`, `SECURITY`, `TEST_PLAN`, `DECISIONS`, `MEMORY`, `MASTER_ROADMAP`, `RULES`, `TASKS`, `README`, `.env.example`, `.gitignore`) | None | Completed | All 15 foundational docs created & verified | Structural review against guidelines |

---

### Phase 1: Authentication Engine
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-001` | Initialize Next.js TypeScript project structure, Tailwind CSS, and base config | `TASK-000` | Completed | Clean Next.js project boots with Tailwind HSL tokens | Build validation (`npm run build`) |
| `TASK-002` | Configure Supabase client (Client, Server Component, and Server Action helpers) | `TASK-001` | Completed | Secure cookie-based SSR Supabase clients initialized | Connection ping test |
| `TASK-003` | Implement Authentication UI & Complete User Flow | `TASK-002` | Completed | Register (with confirm pw), Login, Authenticated State, Logout | Auth E2E test (`TC-AUTH-03`, `04`, `07`) |

---

### Phase 2: Role-Based Authorization & Access Control (RBAC)
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-004` | Role-Based Authorization & Access Control (Student, Company, Admin) | `TASK-003` | Completed | Server-side role resolution, anti-tamper admin protection, Edge middleware guards, 403 unauthorized page, protected placeholder routes | 38/38 unit tests, 39/39 E2E tests, 0 typecheck/lint errors, production build |

---

### Phase 3: Student Profile Suite
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-005` | Student Profile Foundation (Personal, Academic, Skills, Projects, Certifications, Links) | `TASK-004` | Completed | Normalized schema, Zod validation, studentService, Server Actions, photo upload, /student/profile UI | 54/54 unit tests, 48/48 E2E tests, 0 typecheck/lint errors, production build |

---

### Phase 4: Student Dashboard
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-006` | Student Dashboard Foundation & Real Profile Overview | `TASK-005` | Completed | Dynamic completion gauge, profile summary, placement readiness, quick actions, future module empty states | 60/60 unit tests, 57/57 E2E tests, 0 typecheck/lint errors, production build |
| `TASK-007` | Profile Completion Progress Gauge & Alert Banners | `TASK-006` | Pending | Dynamic warning banners for missing resume/skills/records, visual breakdown breakdown gauge | UI test & edge case verification |
| `TASK-008` | Student Metric KPI Cards (Active Applications, Shortlisted Drives, Deadlines) | `TASK-007` | Pending | KPI cards with live application metrics and deadline alerts | Metric calculation unit tests |
| `TASK-009` | Student Recent Drives Feed & Quick Actions | `TASK-008` | Pending | Responsive drive card list, skeleton loading states | Responsive tests (375px, 768px, 1440px) |

---

### Phase 5: Company Profile Suite
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-007` | Company Profile Foundation (Schema, Service, UI & Logo) | `TASK-004` | Completed | Normalized companies/company_users schema, Zod validation, companyService, Server Actions, /company/profile UI, first-time setup empty state | 79/79 unit tests, 69/69 E2E tests, 0 typecheck/lint errors, production build |
| `TASK-008` | Company Verification Status Banner & Administrative Verification Workflow | `TASK-007` | Completed | Dynamic status banners for pending/verified states, /admin/companies queue with verify/revoke controls | 87/87 unit tests, 81/81 E2E tests, 0 typecheck/lint errors, production build |

---

### Phase 6: Company Dashboard
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-009` | Company Dashboard Foundation & Real Organization Overview | `TASK-008` | Completed | Dynamic completion gauge, company overview, recruitment KPI cards, verification banner, future module empty states | 93/93 unit tests, 93/93 E2E tests, 0 typecheck/lint errors, production build |

---

### Phase 7: Jobs & Internships Engine
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-010` | Job Posting Engine Foundation | `TASK-009` | Completed | Normalized jobs schema, Zod validation, jobService, Server Actions, /company/jobs list, /company/jobs/new form, live KPI integration | 108/108 unit tests, 117/117 E2E tests, 0 typecheck/lint errors, production build |
| `TASK-011` | Student Job Discovery Listing & Details | `TASK-010` | Completed | Protected /student/jobs, search, branch/workplace/batch filters, StudentJobCard, eligibilityService, /student/jobs/[jobId] detail view | 127/127 unit tests, 150/150 E2E tests, 0 typecheck/lint errors, production build |
| `TASK-016` | Multi-step Job Creation & Publishing Wizard Polish | `TASK-010` | Pending | Draft/Publish states, CTC formatting, preview before post | Recruiter wizard E2E test |
| `TASK-017` | Advanced Job Moderation & Verification | `TASK-011` | Pending | Admin drive moderation, college verification flags | Admin moderation test |

---

### Phase 8: Job Applications & Pipeline
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-012` | Job Application Engine Foundation | `TASK-011` | Completed | Normalized job_applications schema with UNIQUE(job_id, student_id), applicationService, submitApplicationAction, server-side eligibility check, active deadline & published status validation, interactive Apply Now modal in JobDetailView with confirmation view | 141/141 unit tests, 171/171 E2E tests, 0 typecheck/lint errors, production build |
| `TASK-013` | Student Application Tracker & Timeline View | `TASK-012` | Completed | Protected /student/applications route, status badges, recruitment progress timeline, filter tabs, sort dropdown, empty state CTA | 150/150 unit tests, 192/192 E2E tests, 0 typecheck/lint errors, production build |
| `TASK-014` | Recruiter Candidate Review Board & Stage Transitions | `TASK-013` | Completed | Protected `/company/jobs/[id]/applicants` route, multi-tenant company isolation, job header, 5 KPI cards, search, status filter tabs, sorting, desktop table and mobile cards, candidate detail drawer with full profile, external links, recruiter remarks, status history audit timeline | 163/163 unit tests, 216/216 E2E tests, 0 typecheck/lint errors, production build |
| `TASK-015` | Recruiter Candidate Stage Transition & Pipeline Automation | `TASK-014` | Completed | Authoritative server transition engine, linear progression (`applied` -> `in_review` -> `shortlisted` -> `offered`), terminal outcomes (`rejected`, `withdrawn`, `offered`), terminal warning notices, live pipeline metric sync, student tracker synchronization | 181/181 unit tests, 225/225 E2E tests, 0 typecheck/lint errors, production build |
| `TASK-016` | Application Status History Modal for Full Audit Transparency | `TASK-015` | Completed | Accessible ApplicationStatusHistoryModal, chronological audit log, previous/next status badges, timestamps, attribution, recruiter remarks, terminal-state cards, student ownership & recruiter tenant isolation | 209/209 unit tests, 261/261 E2E tests, 0 typecheck/lint errors, production build |

---

### Phase 9: Admin Placement Portal
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-024` | Executive Admin Placement Dashboard | `TASK-023` | Pending | Institutional metrics (placement rate, avg package, branch distribution) | Admin dashboard test |
| `TASK-025` | Student Verification & Academic Moderation Console | `TASK-024` | Pending | Review academic claims, verify CGPA, flag discrepancies | Academic moderation test |
| `TASK-026` | Company & Job Drive Moderation System | `TASK-025` | Pending | Approve new recruiters and job postings before broadcast | Admin drive approval test |
| `TASK-027` | Placement Reports & CSV Data Export | `TASK-026` | Pending | Filtered export of placed candidates, drive summary sheets | CSV export integrity test |

---

### Phase 10: Resume Management & Secure Storage
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-028` | Secure Resume Upload Service (Supabase Storage) | `TASK-010` | Pending | Strict PDF validation, 5MB limit, private bucket storage | File validation tests |
| `TASK-029` | Signed URL Generator & In-App PDF Previewer | `TASK-028` | Pending | Short-lived signed download links (15 min TTL), authorized preview | Storage access authorization test |

---

### Phase 11: Advanced Search & Filtering
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-030` | High-Performance Server-Side Drive & Candidate Filters | `TASK-023` | Pending | Multi-criteria search query builder with debounced inputs | Filter performance tests |

---

### Phase 12: Notifications System
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-031` | In-App Notification Center & Notification Badges | `TASK-023` | Pending | Unread notification pill, drive alerts, status change toasts | Real-time notification test |

---

### Phase 13: End-to-End Automated Testing
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-032` | Playwright E2E Suite for Student, Recruiter & Admin Flows | `TASK-031` | Pending | 100% pass across mobile (375px), tablet (768px), and desktop | Automated CI run |

---

### Phase 14: Security Hardening & Penetration Review
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-033` | Security Audit: RLS Penetration, XSS, CSRF, Header Security | `TASK-032` | Pending | Zero vulnerability findings in dependency scans & RLS policies | OWASP checklist review |

---

### Phase 15: Performance & Web Vitals Optimization
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-034` | Bundle Analysis, Image Optimization & Lighthouse Polish | `TASK-033` | Pending | Lighthouse Performance score >= 90; CLS < 0.1 | Lighthouse audit run |

---

### Phase 16: Preview Deployment & Staging Validation
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-035` | Vercel Staging Environment Deployment & Migration Smoke Tests | `TASK-034` | Pending | Preview URL functional with live Supabase test instance | Cloud smoke test pass |

---

### Phase 17: Production Deployment & Verification
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-036` | Production Deployment on Vercel with Custom Domain & SSL | `TASK-035` | Pending | Production URL live, SSL verified, zero console errors | Production validation test |

---

### Phase 18: Telemetry, Error Monitoring & Audit Health
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-037` | Sentry / Telemetry Integration & System Health Dashboard | `TASK-036` | Pending | Error tracking capture, live alert webhooks | Synthetic error alert test |

---

### Phase 19: Future AI Capabilities (Deferred — Do NOT Build Now)
| Task ID | Task Description | Dependencies | Status | Acceptance Criteria | Testing Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TASK-038` | AI Resume Keyword & Relevance Analysis | `TASK-037` | Deferred | Plugs into `resumeService` via decoupled adapter | AI test suite |
| `TASK-039` | AI Mock Interview & Candidate Preparation Copilot | `TASK-038` | Deferred | Independent conversational agent interface | AI latency & safety tests |
