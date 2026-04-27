# AIScreener API — Backend Rules

## Folder Structure

```
app/
├── api/
│   └── v1/                         # Versioned API — bump to v2 for breaking changes
│       └── {domain}/               # One package per business domain
│           ├── __init__.py
│           ├── router.py           # FastAPI APIRouter — routes only, no logic
│           ├── schemas.py          # Pydantic request/response models for this domain
│           ├── service.py          # Business logic class, injected via Depends()
│           └── dependencies.py     # Route-level FastAPI Depends() helpers (optional)
│
├── core/                           # Cross-cutting infrastructure
│   ├── config.py                   # pydantic-settings — all env vars in one place
│   ├── security.py                 # JWT encode/decode, password hashing, OTP
│   ├── permissions.py              # Permission enum + ROLE_PERMISSIONS matrix
│   ├── rbac.py                     # get_current_user, require_role, require_permission
│   ├── redis_client.py             # Async Redis connection + helpers
│   ├── email.py                    # Email sending (SMTP + console fallback)
│   ├── token_store.py              # Refresh token + JTI blacklist in Redis
│   └── middleware/
│       └── auth.py                 # Bearer token validation middleware
│
├── db/
│   ├── session.py                  # AsyncSession factory + get_db() dependency
│   └── migrations/                 # Alembic — one file per schema change
│       └── versions/
│
├── models/                         # SQLAlchemy ORM models (one file per table)
│   ├── base.py                     # DeclarativeBase
│   ├── tenant.py
│   └── user.py
│
├── repositories/                   # Data access layer — one class per model
│   ├── base.py                     # Generic BaseRepository[T]
│   ├── tenant.py
│   └── user.py
│
├── celery_app/
│   ├── celery.py                   # Celery app instance
│   ├── beat_schedule.py            # Periodic task schedule
│   └── tasks/                     # One file per domain's async tasks
│
└── sockets/                        # Socket.IO namespace handlers
    └── {namespace}/
        ├── events.py               # Event names (string constants)
        └── handlers.py             # @sio.on() handlers
```

## Endpoint Rules

### Every router file follows this structure

```python
from fastapi import APIRouter, Depends, status
from app.api.v1.{domain}.schemas import XRequest, XResponse
from app.api.v1.{domain}.service import XService
from app.core.rbac import get_current_user, UserContext

router = APIRouter(prefix="/{domain}", tags=["{Domain}"])


@router.post(
    "/",
    response_model=XResponse,
    status_code=status.HTTP_201_CREATED,
    summary="One-line summary shown in Swagger",
    description="""
    Extended description rendered in the Swagger UI.
    Explain what the endpoint does, preconditions, and side effects.
    """,
    responses={
        400: {"description": "Validation error"},
        401: {"description": "Not authenticated"},
        403: {"description": "Forbidden — insufficient permissions"},
        409: {"description": "Conflict — resource already exists"},
    },
)
async def create_x(
    payload: XRequest,
    service: XService = Depends(),
    current_user: UserContext = Depends(get_current_user),
) -> XResponse:
    """
    Create a new X resource.

    Requires: JOB_CREATE permission.
    Tenant-scoped: the resource is created under current_user.tenant_id.
    """
    return await service.create(payload, current_user)
```

### Rules
- **One router per domain** — never put multiple domains in one router file.
- **Router files contain routes only** — no business logic, no DB calls, no if/else.
- All logic lives in `service.py`.
- Use `status.HTTP_*` constants — never raw integers.
- Always declare `response_model` explicitly.
- Always declare the `responses` dict for non-200 codes.
- Every endpoint must have `summary` (one line) and `description` (multi-line if needed).
- Every endpoint function must have a docstring explaining: what it does, required
  permission, and any important side effects.

## Schema Rules

```python
from pydantic import BaseModel, Field, EmailStr
from uuid import UUID
from datetime import datetime


class CreateJobRequest(BaseModel):
    """Payload to create a new job posting."""

    title: str = Field(..., min_length=1, max_length=200, description="Job title")
    description: str = Field(..., description="Full job description in markdown")
    tenant_id: UUID = Field(..., description="Tenant this job belongs to")

    model_config = ConfigDict(str_strip_whitespace=True)


class JobResponse(BaseModel):
    """Single job returned by the API."""

    id: UUID
    title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### Rules
- Every schema class must have a **docstring**.
- Every field must have a `description=` kwarg — this appears in Swagger automatically.
- Use `Field(...)` for required fields with constraints (`min_length`, `gt`, `le`…).
- Request schemas: `model_config = ConfigDict(str_strip_whitespace=True)`.
- Response schemas: `model_config = ConfigDict(from_attributes=True)` (ORM compat).
- Separate Request and Response schemas even if they look identical — they evolve
  independently.
- Paginated responses always use the shared `Page[T]` generic wrapper.

## Service Rules

```python
class JobService:
    """Business logic for the Jobs domain."""

    def __init__(self, db: AsyncSession = Depends(get_db)) -> None:
        self._db = db
        self._jobs = JobRepository(db)
        self._tenants = TenantRepository(db)

    async def create(
        self, payload: CreateJobRequest, actor: UserContext
    ) -> JobResponse:
        """
        Create a job posting under the actor's tenant.

        Raises:
            HTTPException 403: if actor lacks JOB_CREATE permission.
            HTTPException 409: if a job with the same title already exists in the tenant.
        """
        if Permission.JOB_CREATE not in actor.permissions:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")

        existing = await self._jobs.get_by_title(actor.tenant_id, payload.title)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT, "Job title already exists")

        job = await self._jobs.create(JobCreate(
            tenant_id=actor.tenant_id,
            title=payload.title,
            description=payload.description,
            created_by=actor.user_id,
        ))
        await self._db.commit()
        await self._db.refresh(job)
        return JobResponse.model_validate(job)
```

### Rules
- Every service class and every public method must have a **docstring**.
- Docstrings on methods must list: what it does, what it raises (with HTTP status).
- Services never import from other services — compose via shared repositories.
- All DB writes must call `await self._db.commit()`.
- After commit, `await self._db.refresh(obj)` before returning ORM objects.
- Raise `HTTPException` with `status.HTTP_*` constants — never raw integers.
- Never return raw ORM models — always `.model_validate()` to a response schema.

## Repository Rules

```python
class JobRepository(BaseRepository[Job]):
    """Data access layer for the Job model."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, job_id: UUID) -> Job | None:
        """Return a Job by primary key, or None if not found."""
        result = await self._db.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    async def create(self, payload: JobCreate) -> Job:
        """Insert a new Job row and flush (caller must commit)."""
        job = Job(id=uuid4(), **vars(payload), created_at=now(), updated_at=now())
        self._db.add(job)
        await self._db.flush()
        await self._db.refresh(job)
        return job
```

### Rules
- Every repository method must have a **docstring** (one line is enough).
- Repositories only do DB access — no business logic, no HTTP exceptions.
- Repositories `flush()` — the service layer `commit()`s.
- All queries must be tenant-scoped: `where(Model.tenant_id == tenant_id)`.

## Migration Rules

- One migration file per logical schema change.
- File name: `{NNN}_{short_description}.py` (e.g. `005_add_job_status_column.py`).
- Always implement both `upgrade()` and `downgrade()`.
- Add a module-level docstring explaining what the migration does and why.

```python
"""
Add status column to jobs table.

Reason: support draft/published/archived workflow introduced in v0.3.
"""
```

## Swagger / OpenAPI Rules

These things appear in Swagger automatically — always include them:

| Where | What to add |
|---|---|
| `router = APIRouter(...)` | `tags=["Domain Name"]` |
| `@router.post(...)` | `summary=`, `description=`, `responses={}` |
| Pydantic model class | docstring → becomes schema description |
| Pydantic `Field(...)` | `description=` kwarg → becomes field description |
| Service method | docstring with Raises section |

Group tags consistently in `main.py`:

```python
app = FastAPI(
    title="AIScreener API",
    version="0.1.0",
    description="AI-powered technical screening platform.",
    openapi_tags=[
        {"name": "Auth",         "description": "Registration, login, token management"},
        {"name": "Tenants",      "description": "Workspace resolution and settings"},
        {"name": "Jobs",         "description": "Job posting lifecycle"},
        {"name": "Candidates",   "description": "Candidate profiles and pipeline"},
        {"name": "Interviews",   "description": "Session management and live control"},
        {"name": "Screener",     "description": "AI screening configuration and runs"},
        {"name": "CRM",          "description": "Pipeline, offers, analytics"},
    ],
)
```

## Multi-Tenancy Rules

- **Every** model that stores business data must have a `tenant_id: UUID` FK column.
- **Every** repository query must filter by `tenant_id` — no cross-tenant data leaks.
- **Every** service method that accepts a resource ID must verify
  `resource.tenant_id == actor.tenant_id` before returning or mutating it.
- Use `require_same_tenant(resource.tenant_id)` dependency for route-level checks.

## Error Handling Rules

- Use `HTTPException` with these status codes consistently:
  - `400` — bad input that passed schema validation but is logically wrong
  - `401` — not authenticated (missing/invalid token)
  - `403` — authenticated but not authorized
  - `404` — resource not found (always tenant-scoped check first)
  - `409` — conflict (duplicate subdomain, email, etc.)
  - `422` — Pydantic validation failure (automatic, do not raise manually)
- Never leak internal details (stack traces, SQL) in error `detail` strings.

## Do Not
- Do not put business logic in `router.py` — only in `service.py`.
- Do not call `await self._db.commit()` inside a repository — only in services.
- Do not return raw SQLAlchemy ORM objects from endpoints — always use response schemas.
- Do not create endpoints without `summary`, `response_model`, and a docstring.
- Do not hardcode tenant IDs or user IDs — always derive from `UserContext`.
- Do not skip the `responses={}` dict on router decorators — Swagger needs it.
- Do not add a new domain without registering its router in `main.py` with a tag.
