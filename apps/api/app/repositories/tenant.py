from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant
from app.repositories.base import BaseRepository


@dataclass
class TenantCreate:
    name: str
    subdomain: str
    plan: str


@dataclass
class TenantAuthConfig:
    require_mfa: bool
    session_ttl_hours: int


class TenantRepository(BaseRepository[Tenant]):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, tenant_id: UUID) -> Tenant | None:
        result = await self._db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def get_by_subdomain(self, subdomain: str) -> Tenant | None:
        result = await self._db.execute(
            select(Tenant).where(Tenant.subdomain == subdomain)
        )
        return result.scalar_one_or_none()

    async def create(self, payload: TenantCreate) -> Tenant:
        now = datetime.now(timezone.utc)
        tenant = Tenant(
            id=uuid4(),
            name=payload.name,
            subdomain=payload.subdomain,
            plan=payload.plan,
            config={},
            created_at=now,
            updated_at=now,
        )
        self._db.add(tenant)
        await self._db.flush()
        await self._db.refresh(tenant)
        return tenant

    async def update_config(self, tenant_id: UUID, config: dict) -> Tenant:
        tenant = await self.get_by_id(tenant_id)
        tenant.config = {**tenant.config, **config}
        tenant.updated_at = datetime.now(timezone.utc)
        await self._db.flush()
        return tenant

    async def deactivate(self, tenant_id: UUID) -> None:
        tenant = await self.get_by_id(tenant_id)
        if tenant:
            tenant.is_active = False
            tenant.updated_at = datetime.now(timezone.utc)
            await self._db.flush()

    async def get_auth_config(self, tenant_id: UUID) -> TenantAuthConfig:
        tenant = await self.get_by_id(tenant_id)
        auth_cfg = (tenant.config or {}).get("auth", {})
        return TenantAuthConfig(
            require_mfa=auth_cfg.get("require_mfa", False),
            session_ttl_hours=auth_cfg.get("session_ttl_hours", 24),
        )
