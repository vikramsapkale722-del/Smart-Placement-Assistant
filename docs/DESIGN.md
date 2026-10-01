# Design System & UI/UX Guidelines
## Smart Placement Portal

---

### 1. Design Philosophy & Aesthetic Identity

The visual identity of the Smart Placement Portal is designed to feel like a **modern, high-end enterprise SaaS platform** (similar to Linear, Stripe Dashboard, or Raycast), rather than a dated or generic academic website.

#### Core Aesthetic Tenets:
- **Clean & Editorial:** High contrast, deliberate typography, meticulous vertical rhythm.
- **Trustworthy & Authoritative:** Slate/zinc neutrals with a purposeful deep sapphire/indigo primary brand color.
- **Quiet Depth:** Subtle 1px borders (`border-border`), layered translucent surfaces, and micro-shadows rather than gaudy heavy drop-shadows or chaotic gradients.
- **Intentional Micro-interactions:** Crisp transitions (150ms ease-out), tactile button clicks, and state indicators that convey system responsiveness.

---

### 2. Typography & Font Hierarchy

- **Primary Font Family:** `Inter`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Font Family (for CTC, Codes, IDs, Hashes):** `JetBrains Mono`, `ui-monospace, monospace`

#### Hierarchy Scale:
| Level | Size | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display (H1)** | 32px / 2.0rem | 700 (Bold) | 1.2 | -0.025em | Main Hero headers, executive KPI headers |
| **Heading 2 (H2)** | 24px / 1.5rem | 600 (Semibold) | 1.25 | -0.02em | Section titles, dashboard card group headers |
| **Heading 3 (H3)** | 20px / 1.25rem | 600 (Semibold) | 1.3 | -0.015em | Modal titles, job posting titles |
| **Heading 4 (H4)** | 16px / 1.0rem | 600 (Semibold) | 1.4 | -0.01em | Table section subheaders, card titles |
| **Body Large** | 16px / 1.0rem | 400 / 500 | 1.5 | 0 | Lead paragraphs, modal body text |
| **Body Default** | 14px / 0.875rem | 400 / 500 | 1.5 | 0 | Default inputs, table cells, descriptions |
| **Body Small** | 12px / 0.75rem | 400 / 500 | 1.4 | +0.01em | Helper captions, timestamps, meta info |
| **Badge / Tag** | 11px / 0.6875rem | 600 (Semibold) | 1.0 | +0.03em (Uppercase) | Status indicators, eligibility pills |

---

### 3. Color Palette & Tokens (Tailwind HSL System)

The design system uses HSL token variables to allow instant light and dark mode adaptation with optimal contrast ratios (WCAG 2.1 AA compliant).

#### 3.1 Neutral & Surface Tokens
| Token | Light Mode Value | Dark Mode Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--background` | `hsl(210, 20%, 98%)` | `hsl(222, 47%, 7%)` | Primary page canvas background |
| `--surface` | `hsl(0, 0%, 100%)` | `hsl(222, 47%, 10%)` | Elevated card & container surface |
| `--surface-hover`| `hsl(210, 20%, 96%)` | `hsl(222, 47%, 13%)` | Table row hover, menu item hover |
| `--border` | `hsl(214, 32%, 91%)` | `hsl(217, 33%, 17%)` | 1px border lines, table separators |
| `--text-primary` | `hsl(222, 47%, 11%)` | `hsl(210, 40%, 98%)` | Headings, primary high-contrast text |
| `--text-muted` | `hsl(215, 16%, 47%)` | `hsl(215, 20%, 65%)` | Secondary body text, timestamps, labels |

#### 3.2 Brand & Semantic Tokens
| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| `--primary` | `hsl(221, 83%, 53%)` | `hsl(217, 91%, 60%)` | Primary action buttons, active tab lines |
| `--primary-foreground` | `hsl(210, 40%, 98%)` | `hsl(222, 47%, 11%)` | Text on primary brand buttons |
| `--success` | `hsl(142, 71%, 45%)` | `hsl(142, 71%, 45%)` | Hired, Eligible, Verified, Published |
| `--success-bg` | `hsl(143, 85%, 96%)` | `hsl(143, 60%, 12%)` | Success badge background |
| `--warning` | `hsl(38, 92%, 50%)` | `hsl(38, 92%, 50%)` | Pending Review, Deadline Approaching |
| `--warning-bg` | `hsl(48, 100%, 96%)` | `hsl(48, 60%, 12%)` | Warning badge background |
| `--error` | `hsl(0, 84%, 60%)` | `hsl(0, 72%, 51%)` | Ineligible, Rejected, Form validation error |
| `--error-bg` | `hsl(0, 93%, 97%)` | `hsl(0, 50%, 12%)` | Error banner & badge background |
| `--info` | `hsl(199, 89%, 48%)` | `hsl(199, 89%, 48%)` | Shortlisted, Interview scheduled |
| `--info-bg` | `hsl(204, 94%, 94%)` | `hsl(204, 60%, 12%)` | Info badge background |

---

### 4. Layout, Spacing Scale & Elevation

#### 4.1 Spacing Scale
- `2xs`: `0.25rem (4px)`
- `xs`: `0.5rem (8px)`
- `sm`: `0.75rem (12px)`
- `md`: `1.0rem (16px)`
- `lg`: `1.5rem (24px)`
- `xl`: `2.0rem (32px)`
- `2xl`: `3.0rem (48px)`

#### 4.2 Border Radius
- Buttons, Inputs, Badges: `rounded-md (6px)`
- Cards, Modals, Dropdowns: `rounded-xl (12px)`
- Pill Badges: `rounded-full (9999px)`

#### 4.3 Elevation & Shadows
- `shadow-xs`: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Input fields, table rows)
- `shadow-sm`: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` (Cards)
- `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` (Dropdowns, Popovers)
- `shadow-xl`: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` (Modals, Dialogs)

#### 4.4 Responsive Breakpoints
- **Mobile (`sm`):** `375px` - Single column vertical flow, bottom navigation or collapsible drawer, full-width buttons.
- **Tablet (`md`):** `768px` - Collapsible sidebar, two-column grids for cards and stats.
- **Desktop (`lg`):** `1024px` - Fixed 260px sidebar navigation, multi-column dashboard grid, full data tables.
- **Large Desktop (`xl`):** `1440px` - Max container constraint `max-w-7xl mx-auto`, optimized for data density.

---

### 5. Standard Component Guidelines

#### 5.1 Buttons
- **Primary:** Solid brand fill (`bg-primary text-primary-foreground hover:bg-primary/90`), subtle press transform.
- **Secondary / Outline:** Bordered with subtle neutral stroke (`border border-border bg-surface hover:bg-surface-hover text-text-primary`).
- **Destructive:** Red accent (`bg-error text-white hover:bg-error/90`).
- **Ghost:** Borderless with hover fill (`hover:bg-surface-hover text-text-muted hover:text-text-primary`).
- **States:** Always includes a spinner-enabled `loading` state that disables clicks and maintains button width.

#### 5.2 Form Inputs & Controls
- **Text Inputs & Selects:** Height `40px` (or `44px` on mobile for touch accessibility), 1px border (`border-border`), transition to focus ring (`focus:ring-2 focus:ring-primary/20 focus:border-primary`).
- **Labels:** Crisp 13px medium (`font-medium text-text-primary`), explicit required asterisks `*`.
- **Validation Messages:** Red 12px text directly beneath input with animated slide-in; input border turns `border-error`.

#### 5.3 Data Tables
- Clean zebra or separated line rows, sticky header with background blur, explicit column sort indicators, hover highlight, and mobile card-mode fallback for narrow screens.

#### 5.4 Application Status Badges
Consistent semantic status mapping across the platform:
- `Applied`: Gray/Neutral badge
- `Under Review`: Blue/Info badge
- `Shortlisted`: Cyan/Info badge
- `Assessment / Test`: Amber/Warning badge
- `Interview Scheduled`: Violet/Purple badge
- `Offered`: Emerald/Success badge
- `Accepted / Hired`: Solid Green badge with checkmark
- `Rejected`: Rose/Error badge
- `Withdrawn`: Muted Gray badge

#### 5.5 Empty States
Every list, table, or tab view MUST have a dedicated Empty State component:
- Descriptive icon (stroke-based, 48px, muted)
- Clear, encouraging heading (e.g., "No active applications yet")
- 1-sentence explanatory body text
- Direct call-to-action button (e.g., "Browse Available Drives")

#### 5.6 Skeletons & Loading States
- Pulse animation with low contrast (`bg-border/60 animate-pulse rounded`).
- Skeleton geometry matches the final component geometry exactly (preventing layout shift).
