# Strict AI Development Rules
## Smart Placement Portal

As an autonomous AI Coding Agent and Senior Engineering Team, you MUST strictly adhere to the following 25 non-negotiable development rules throughout the lifecycle of this project.

---

### The 25 Core Development Rules

1. **Never modify unrelated files:** Only touch files directly required for the current approved task.
2. **Never rewrite working modules unnecessarily:** Prefer surgical, minimal additions over broad rewrites.
3. **Never create duplicate functionality:** Search the codebase first before creating a new utility, helper, or component.
4. **Reuse existing components:** Adhere to the design system in `docs/DESIGN.md` and reuse existing UI primitives (`src/components/ui`).
5. **Follow ARCHITECTURE.md:** Enforce strict separation between UI components, service layers, and Supabase data clients.
6. **Follow DESIGN.md:** Strictly adhere to typography, HSL color tokens, spacing scales, card styles, and responsive breakpoints. No arbitrary inline colors or ad-hoc Tailwind classes.
7. **Follow SECURITY.md:** Zero trust in client requests. All authorization (RBAC) and data mutations must be validated server-side.
8. **Validate all user input:** Use Zod schemas across client forms and server actions. Never trust incoming payloads.
9. **Verify authorization server-side:** Assert roles (`student`, `company`, `admin`) in Next.js Server Components, Server Actions, and Route Handlers.
10. **Never expose secrets:** Never commit API keys, service-role keys, or database credentials. Never prefix private secrets with `NEXT_PUBLIC_`.
11. **Add tests for important functionality:** Unit tests for business logic, integration tests for services, and Playwright E2E tests for user flows.
12. **Maintain responsive UI:** Ensure every view looks and functions impeccably at 375px (mobile), 768px (tablet), and 1440px (desktop).
13. **Handle loading/error/empty states:** Every data-dependent view must provide a loading skeleton, an empty state with an actionable CTA, and a resilient error state.
14. **Do not change database schema without documenting it:** Update `docs/DATABASE.md` before or concurrently with any migration or schema adjustment.
15. **Do not introduce unnecessary dependencies:** Only install vetted, approved libraries. Do not use competing libraries for identical tasks.
16. **Keep functions and modules maintainable:** Keep functions small, single-responsibility, fully typed, and cleanly commented where non-obvious rationale exists.
17. **Update documentation after major changes:** Keep `docs/MEMORY.md`, `docs/MASTER_ROADMAP.md`, and task logs synchronized with the current codebase state.
18. **Run tests before completing a task:** Execute automated tests or build verification commands (`npm run build`, `npm run test`) to prove correctness before concluding.
19. **Never skip the review stage:** Inspect git diffs and code against PRD, ARCHITECTURE, and SECURITY criteria before declaring a task finished.
20. **Never automatically continue to the next task:** Complete only the single approved task ID. Report progress and STOP. Wait for explicit user approval before proceeding.
21. **Never build future phases without explicit approval:** Defer out-of-scope features (e.g. AI features in Phase 19, SMS automation) until explicitly directed.
22. **Preserve architectural decisions:** Honor all approved ADRs in `docs/DECISIONS.md`. Do not arbitrarily switch frameworks or paradigms.
23. **Prefer the smallest safe change:** When implementing fixes or features, apply the minimal change set that solves the requirement safely.
24. **Do not use mock authentication in production code:** Always build on real Supabase Auth sessions and tokens; no fake bypass flags in production routes.
25. **Do not use fake database data as a replacement for real implementation:** Build real schema migrations, real queries, and real typed data access layers.
