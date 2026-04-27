from dataclasses import dataclass, field
from typing import Callable
from uuid import UUID

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from app.core.permissions import Permission
from app.core.security import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


@dataclass
class UserContext:
    user_id: UUID
    tenant_id: UUID
    role: str
    plan: str
    email: str
    mfa_verified: bool
    permissions: set[Permission] = field(default_factory=set)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> UserContext:
    raise NotImplementedError


def require_role(*roles: str) -> Callable:
    raise NotImplementedError


def require_permission(permission: Permission) -> Callable:
    raise NotImplementedError


def require_same_tenant(resource_tenant_id: UUID) -> Callable:
    raise NotImplementedError


async def require_mfa(token_data: TokenPayload) -> None:
    raise NotImplementedError
