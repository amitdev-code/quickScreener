from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.models.user_session import UserSession
from app.repositories.base import BaseRepository


@dataclass
class UserSessionCreate:
    user_id: UUID
    tenant_id: UUID
    jti: str
    ip_address: str
    user_agent: str
    expires_at: datetime


class UserSessionRepository(BaseRepository[UserSession]):
    async def create(self, payload: UserSessionCreate) -> UserSession:
        raise NotImplementedError

    async def get_active_sessions(self, user_id: UUID) -> list[UserSession]:
        raise NotImplementedError

    async def revoke(self, jti: str) -> None:
        raise NotImplementedError

    async def revoke_all(self, user_id: UUID) -> None:
        raise NotImplementedError

    async def get_by_jti(self, jti: str) -> UserSession | None:
        raise NotImplementedError
