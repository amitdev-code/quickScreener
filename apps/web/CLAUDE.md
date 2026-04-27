# AIScreener Web — Frontend Rules

## Folder Structure

```
src/
├── app/                        # App-level setup (router, providers, global store init)
│   ├── providers.tsx           # Wraps QueryClient, Auth, Theme providers
│   └── router.tsx              # Central route definitions
│
├── assets/                     # Static: images, fonts, icons (imported, not in /public)
│
├── components/                 # Shared, domain-agnostic UI components
│   ├── ui/                     # Primitives: Button, Input, Badge, Modal, Spinner…
│   │   └── button/
│   │       ├── Button.tsx
│   │       ├── Button.module.css
│   │       └── index.ts        # re-export
│   ├── layout/                 # Shell, Sidebar, Topbar, PageHeader
│   └── data-display/           # Table, Card, EmptyState, Avatar
│
├── features/                   # Domain slices — one folder per business domain
│   └── {domain}/               # e.g. auth, jobs, candidates, interviews, crm
│       ├── components/         # UI components owned by this domain
│       ├── hooks/              # use-{domain}-*.ts
│       ├── {domain}.service.ts # API calls (Axios)
│       ├── {domain}.queries.ts # TanStack Query mutations/queries
│       ├── {domain}.store.ts   # Zustand slice (if needed)
│       ├── {domain}.schema.ts  # Zod validation for forms in this domain
│       └── {domain}.types.ts   # Local types not in shared-types
│
├── lib/                        # Technical helpers with no domain knowledge
│   ├── api.ts                  # Axios instance
│   ├── auth/                   # Token storage, JWT utils, interceptors, guards
│   └── utils/                  # cn(), formatDate(), debounce()…
│
├── pages/                      # One file per route — thin shells, import feature components
│   └── {domain}/
│       └── {PageName}Page.tsx
│
├── hooks/                      # Cross-domain React hooks (useMediaQuery, useDebounce…)
├── styles/                     # Global CSS: variables, reset, typography
└── types/                      # App-wide ambient types not belonging to any feature
```

## Component Rules

### Every component must be in its own folder
```
components/ui/button/
├── Button.tsx          ← component implementation
├── Button.module.css   ← scoped styles (CSS Modules preferred over inline)
└── index.ts            ← export default Button;
```

### Component file anatomy
```tsx
// 1. Imports — external libs, then internal, then types
// 2. Types/interfaces (Props interface above component)
// 3. Component function — named export + default export
// 4. Sub-components in same file only if < 30 lines and not reused elsewhere
```

### Naming conventions
| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase | `JobCard.tsx` |
| Hook file | camelCase prefixed `use-` | `use-job-list.ts` |
| Service / query file | kebab-case with suffix | `jobs.service.ts` |
| CSS Module | same as component | `JobCard.module.css` |
| Page file | PascalCase + `Page` suffix | `JobListPage.tsx` |

### Component size limits
- A component must do **one thing**. If it renders > ~150 lines of JSX, split it.
- Extract any list item into its own component (`JobCard`, `CandidateRow`).
- Extract any modal/drawer into its own component file.

### Props
- Always define a named `Props` interface above the component.
- Use `React.ReactNode` for children.
- Never use `any` — use `unknown` and narrow, or define a type.
- Required props first, optional last.

### State management
- **Local state** (`useState`/`useReducer`) for UI-only state (open/closed, tab index).
- **TanStack Query** for all server state (fetch, cache, mutate).
- **Zustand** only for shared client state that survives navigation (auth, theme, sidebar).
- Never store server data in Zustand — that's what Query cache is for.

## Feature Slice Rules

Every domain gets its own slice under `features/{domain}/`. Never reach into another
feature's internals — import from its `index.ts` barrel only.

### Service file (`{domain}.service.ts`)
- One function per API endpoint.
- Every function is `async`, returns a typed Promise.
- Use the shared `api` Axios instance — never create a new one.

### Query file (`{domain}.queries.ts`)
- One hook per operation: `useJobList`, `useJobById`, `useCreateJob`.
- Query keys must be arrays and follow the hierarchy:
  `["jobs"]` → `["jobs", id]` → `["jobs", id, "sessions"]`
- Mutations call `queryClient.invalidateQueries` on success to keep cache fresh.

### Schema file (`{domain}.schema.ts`)
- Zod schemas for all form validation.
- Derive TypeScript types from Zod (`z.infer<typeof Schema>`).
- Re-export from `index.ts` — never import the `.schema.ts` file directly from a page.

## CSS Rules

- Use **CSS Modules** for component-scoped styles (`Button.module.css`).
- Use **global CSS variables** (defined in `styles/variables.css`) for all design tokens:
  colors, spacing, radii, shadows, font sizes.
- Never hard-code color hex values in component files — use `var(--color-*)`.
- Responsive breakpoints defined once in `styles/breakpoints.css`, used via media queries.
- Tailwind is **not** used in this project — stick to CSS Modules + variables.

## Pages Rules

- Pages are **thin shells**: they import feature components, set the page title, handle
  top-level loading/error boundaries.
- Pages must **not** contain business logic or direct API calls — delegate to feature hooks.
- Every page must have an `<ErrorBoundary>` and a `<Suspense>` wrapper.

## Import Order (enforced by linter)
1. React
2. Third-party libraries
3. `@aiscreener/shared-types`
4. Internal `@/components`, `@/features`, `@/lib`, `@/hooks`
5. Relative imports `./`
6. Types (`import type`)

## Do Not
- Do not use `React.FC` — use plain function with typed Props.
- Do not use default exports for hooks or services — named exports only.
- Do not use `index.tsx` as a component file — only as a re-export barrel.
- Do not put business logic in pages.
- Do not import from deep inside another feature (`features/jobs/hooks/use-job-list.ts`) —
  only from its barrel (`features/jobs`).
- Do not create a new Axios instance — use `lib/api.ts`.
- Do not bypass the Query cache with direct `api.*` calls inside components — use hooks.
