from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


@dataclass
class UserCreate:
    tenant_id: UUID
    email: str
    hashed_password: str
    full_name: str
    role: str


@dataclass
class UserUpdate:
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None
    mfa_enabled: bool | None = None
    hashed_password: str | None = None


@dataclass
class Page:
    items: list
    total: int
    page: int
    size: int


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self._db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, tenant_id: UUID, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.tenant_id == tenant_id, User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_all_by_tenant(
        self,
        tenant_id: UUID,
        role: str | None,
        page: int,
        size: int,
    ) -> Page:
        q = select(User).where(User.tenant_id == tenant_id)
        if role:
            q = q.where(User.role == role)
        result = await self._db.execute(q.offset((page - 1) * size).limit(size))
        items = list(result.scalars().all())
        return Page(items=items, total=len(items), page=page, size=size)

    async def create(self, payload: UserCreate) -> User:
        now = datetime.now(timezone.utc)
        user = User(
            id=uuid4(),
            tenant_id=payload.tenant_id,
            email=payload.email,
            hashed_password=payload.hashed_password,
            full_name=payload.full_name,
            role=payload.role,
            created_at=now,
            updated_at=now,
        )
        self._db.add(user)
        await self._db.flush()
        await self._db.refresh(user)
        return user

    async def update(self, user_id: UUID, payload: UserUpdate) -> User:
        values = {k: v for k, v in vars(payload).items() if v is not None}
        values["updated_at"] = datetime.now(timezone.utc)
        await self._db.execute(update(User).where(User.id == user_id).values(**values))
        return await self.get_by_id(user_id)

    async def soft_delete(self, user_id: UUID) -> None:
        await self._db.execute(
            update(User)
            .where(User.id == user_id)
            .values(deleted_at=datetime.now(timezone.utc))
        )

    async def increment_token_version(self, user_id: UUID) -> int:
        user = await self.get_by_id(user_id)
        new_version = (user.token_version or 0) + 1
        await self._db.execute(
            update(User).where(User.id == user_id).values(token_version=new_version)
        )
        return new_version

    async def update_last_login(self, user_id: UUID) -> None:
        await self._db.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.now(timezone.utc))
        )
