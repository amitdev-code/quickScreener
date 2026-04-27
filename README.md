# quickScreener

AI-powered recruiting platform. Multi-tenant SaaS with a FastAPI backend, a recruiter web app, and a candidate interview app — all in a single monorepo.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Migrations](#database-migrations)
- [Running Tests](#running-tests)
- [Docker Compose](#docker-compose)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Architecture Overview

```
Browser (Recruiter)          Browser (Candidate)
        │                            │
        ▼                            ▼
  apps/web (Vite)           apps/candidate (Vite)
  :3000                     :3001
        │                            │
        └──────────┬─────────────────┘
                   ▼
          apps/api (FastAPI)
          :8000
          ├── REST   /api/v1/…
          ├── WS     Socket.IO namespaces
          ├── Celery background tasks
          │
          ├── PostgreSQL  :5432
          └── Redis       :6379
```

Every resource is scoped to a **tenant** (company workspace). The frontend resolves the tenant by subdomain before login; all backend queries filter by `tenant_id`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2 (async), Alembic, Celery |
| Auth | JWT RS256 — access token (15 min, in-memory) + refresh token (7 days, localStorage) |
| MFA | TOTP via `pyotp`, secrets encrypted with AES-256 at rest |
| Real-time | Socket.IO (`python-socketio`) — interview, screener, proctor, CRM namespaces |
| Database | PostgreSQL 16 (asyncpg driver) |
| Cache / Queue | Redis 7 — OTP store, Celery broker & result backend |
| Frontend | React 18, Vite 5, TypeScript 5, Zustand, TanStack Query, Axios, Zod |
| Shared types | `packages/shared-types` — Zod schemas consumed by both frontends |
| Package manager | pnpm workspaces |
| Infrastructure | Docker Compose (local), Kubernetes (k8s/), Terraform (AWS Secrets Manager) |

---

## Monorepo Structure

```
quickScreener/
├── apps/
│   ├── api/                  FastAPI backend
│   │   ├── app/
│   │   │   ├── api/v1/       Route handlers (auth, tenants, …)
│   │   │   ├── celery_app/   Celery worker + beat schedules
│   │   │   ├── core/         Config, security, middleware, RBAC
│   │   │   ├── db/           SQLAlchemy session + Alembic migrations
│   │   │   ├── models/       ORM models (tenant, user, session, MFA)
│   │   │   ├── repositories/ Data-access layer (all queries tenant-scoped)
│   │   │   ├── sockets/      Socket.IO namespaces
│   │   │   └── tests/        Unit + integration tests
│   │   ├── main.py           ASGI entry point (FastAPI + Socket.IO)
│   │   └── pyproject.toml
│   │
│   ├── web/                  Recruiter web app
│   │   └── src/
│   │       ├── components/   Shared UI (layout, guards)
│   │       ├── features/     Domain slices: auth, …
│   │       ├── lib/          API client, JWT helpers, Axios interceptors
│   │       └── pages/        Thin route shells
│   │
│   └── candidate/            Candidate interview app
│       └── src/
│           └── lib/auth/     Interview-link auth + socket auth
│
├── packages/
│   └── shared-types/         Zod schemas + TypeScript types (used by both apps)
│
├── scripts/
│   ├── dev.sh                One-command local startup
│   └── gen-jwt-keys.sh       RS256 key pair generator
│
├── docker-compose.yml        PostgreSQL + Redis for local dev
├── k8s/                      Kubernetes manifests
└── terraform/                AWS Secrets Manager module
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | ≥ 3.12 | `pyenv install 3.12` |
| uv | latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Node.js | ≥ 20 | `nvm install 20` |
| pnpm | latest | `npm install -g pnpm` |
| PostgreSQL | 16 | `brew install postgresql@16` |
| Redis | 7 | `brew install redis` |
| OpenSSL | any | `brew install openssl` |

---

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/amitdev-code/quickScreener.git
cd quickScreener
pnpm install            # installs all Node workspaces
```

### 2. Start backing services

```bash
docker compose up -d    # starts Postgres :5432 and Redis :6379
```

Or start them natively:

```bash
brew services start postgresql@16
brew services start redis
```

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
```

Generate the required secrets:

```bash
# RS256 JWT key pair
bash scripts/gen-jwt-keys.sh

# AES-256 MFA encryption key
python3 -c "import secrets; print('MFA_TOTP_SECRET_ENCRYPTION_KEY=' + secrets.token_hex(32))"
```

Paste the output values into `apps/api/.env`.

### 4. Start everything

```bash
bash scripts/dev.sh
```

The script checks prerequisites, applies any pending migrations, then starts all processes:

| Service | URL |
|---|---|
| FastAPI + Swagger UI | http://localhost:8000/docs |
| Recruiter web app | http://localhost:3000 |
| Candidate interview app | http://localhost:3001 |
| Celery worker logs | `.logs/celery-worker.log` |

```bash
bash scripts/dev.sh --no-celery   # skip Celery (if Redis is unavailable)
bash scripts/dev.sh --check       # validate setup without starting services
```

Press **Ctrl+C** to stop all processes cleanly.

---

## Environment Variables

All variables are documented with examples in `apps/api/.env.example`. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql+asyncpg://…`) |
| `REDIS_URL` | Redis connection string (`redis://localhost:6379/0`) |
| `JWT_SECRET_KEY` | RS256 PEM private key — generate with `scripts/gen-jwt-keys.sh` |
| `JWT_PUBLIC_KEY` | RS256 PEM public key — generate with `scripts/gen-jwt-keys.sh` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (default: 15) |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL (default: 7) |
| `MFA_TOTP_SECRET_ENCRYPTION_KEY` | 32-byte hex key for AES-256 encryption of TOTP secrets |
| `SMTP_HOST` / `SMTP_PORT` | SMTP config for OTP verification emails |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |

---

## API Reference

Interactive docs are available at **http://localhost:8000/docs** when the API is running.

### Auth — `/api/v1/auth`

| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Create tenant + admin user; triggers email OTP |
| `POST` | `/verify-email` | Confirm OTP from registration email |
| `POST` | `/login` | Email + password login; returns access + refresh tokens |
| `POST` | `/refresh` | Exchange refresh token for a new access token |
| `POST` | `/logout` | Revoke current session |
| `POST` | `/logout-all` | Revoke all sessions for the current user |
| `GET` | `/me` | Return authenticated user profile |
| `POST` | `/mfa/enroll` | Begin TOTP MFA enrollment; returns QR code URI |
| `POST` | `/mfa/verify` | Verify TOTP code to complete MFA enrollment |
| `POST` | `/password/reset-request` | Send password reset email |
| `POST` | `/password/reset` | Complete password reset with token |
| `POST` | `/interview-link/verify` | Verify a time-limited candidate interview link |

### Tenants — `/api/v1/tenants`

| Method | Path | Description |
|---|---|---|
| `GET` | `/resolve?subdomain=…` | Resolve a subdomain to a `tenant_id` |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness check — returns `{"status": "ok"}` |

---

## Database Migrations

Migrations are managed with **Alembic** inside `apps/api/`.

```bash
cd apps/api
source .venv/bin/activate

# Apply all pending migrations
alembic upgrade head

# Check current revision
alembic current

# Create a new migration
alembic revision --autogenerate -m "add_interviews_table"

# Roll back one step
alembic downgrade -1
```

Migration files live in `apps/api/app/db/migrations/versions/`.

---

## Running Tests

```bash
cd apps/api
source .venv/bin/activate

# Run all tests
pytest

# With coverage report
pytest --cov=app --cov-report=term-missing

# Run a specific test file
pytest app/tests/unit/test_security.py
```

Frontend type-checking:

```bash
# From repo root
pnpm --filter @aiscreener/web typecheck
pnpm --filter @aiscreener/shared-types typecheck
```

---

## Docker Compose

`docker-compose.yml` provides Postgres and Redis for local development only. It does not run the application itself.

```bash
docker compose up -d        # start
docker compose down         # stop (data volumes preserved)
docker compose down -v      # stop and delete all data
```

---

## Deployment

### Kubernetes

Manifests are in `k8s/`. Apply with:

```bash
kubectl apply -f k8s/
```

> **Note:** `k8s/secrets.yaml` is gitignored. Create it from your secrets manager before deploying.

### Terraform

The `terraform/` directory contains an AWS Secrets Manager module for managing production secrets.

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## Contributing

1. Branch off `main`: `git checkout -b feat/your-feature`
2. Follow the domain pattern in `CLAUDE.md` when adding new features.
3. All shared API contracts go in `packages/shared-types` first.
4. Every backend query must filter by `tenant_id`.
5. No `any` in TypeScript. No untyped Python functions.
6. Run `pytest` and `pnpm typecheck` before opening a PR.
