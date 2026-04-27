# AIScreener — Project Rules

## What This Is
Multi-tenant AI-powered recruiting SaaS. Monorepo with a FastAPI backend and two React/Vite
frontends (recruiter web app + candidate interview app).

## Monorepo Layout
```
apps/
  api/          FastAPI backend        → see apps/api/CLAUDE.md
  web/          Recruiter web app      → see apps/web/CLAUDE.md
  candidate/    Candidate interview    → same rules as apps/web/CLAUDE.md
packages/
  shared-types/ Zod schemas + TS types shared between all apps
scripts/
  dev.sh        Start everything locally
```

## Shared Types (`packages/shared-types`)
- Every type shared between frontend and backend lives here as a Zod schema.
- Derive TypeScript types with `z.infer<typeof Schema>`.
- Backend Python schemas in `apps/api/app/api/v1/{domain}/schemas.py` must mirror these.
- When adding a new API contract: update shared-types first, then implement both sides.

## Multi-Tenancy
Every feature is tenant-scoped. When building anything:
- Backend: all DB queries filter by `tenant_id`. All service methods verify tenant ownership.
- Frontend: `tenant_id` comes from the auth store (`useAuthStore().user.tenant_id`).
  Never hardcode or prompt for a tenant ID in UI after login.

## Authentication
- JWT RS256. Access token (15 min, in memory). Refresh token (7 days, in localStorage).
- After registration → email OTP verification required before access tokens are issued.
- Token refresh is handled automatically by `useTokenRefresh` hook and Axios interceptor.

## Adding a New Domain
1. **shared-types**: add schemas and types.
2. **Backend** (`apps/api`):
   - `app/models/{domain}.py` — SQLAlchemy model with `tenant_id` FK
   - `app/repositories/{domain}.py` — data access, all queries tenant-scoped
   - `app/api/v1/{domain}/` — router, schemas, service (follow `apps/api/CLAUDE.md`)
   - `app/db/migrations/versions/{NNN}_{domain}.py` — Alembic migration
   - Register router in `main.py` with an OpenAPI tag
3. **Frontend** (`apps/web`):
   - `src/features/{domain}/` — service, queries, store, components (follow `apps/web/CLAUDE.md`)
   - `src/pages/{domain}/` — thin page shells
   - Add routes to `src/app/router.tsx`

## Code Quality
- No `any` in TypeScript. No untyped Python functions.
- No business logic in route handlers or page components.
- Every public function/method has a docstring or JSDoc comment explaining WHY, not WHAT.
- Tests live in `apps/api/app/tests/{domain}/` and `apps/web/src/__tests__/`.

## Running Locally
```bash
bash scripts/dev.sh            # starts API + web + candidate
bash scripts/dev.sh --no-celery  # skip Celery (if Redis not running)
bash scripts/dev.sh --check    # check setup without starting
```
Logs: `.logs/api.log`, `.logs/web.log`, `.logs/candidate.log`
