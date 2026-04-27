from dataclasses import dataclass
from datetime import datetime


@dataclass
class RefreshTokenRecord:
    jti: str
    user_id: str
    tenant_id: str
    token: str
    created_at: datetime
    expires_at: datetime


async def store_refresh_token(
    user_id: str,
    tenant_id: str,
    jti: str,
    token: str,
    ttl: int,
) -> None:
    raise NotImplementedError


async def get_refresh_token(jti: str) -> RefreshTokenRecord | None:
    raise NotImplementedError


async def revoke_refresh_token(jti: str) -> None:
    raise NotImplementedError


async def revoke_all_user_tokens(user_id: str) -> None:
    raise NotImplementedError


async def get_token_version(user_id: str) -> int:
    raise NotImplementedError


async def increment_token_version(user_id: str) -> int:
    raise NotImplementedError


async def blacklist_jti(jti: str, ttl: int) -> None:
    raise NotImplementedError


async def is_jti_blacklisted(jti: str) -> bool:
    raise NotImplementedError


async def store_mfa_challenge(
    user_id: str, challenge_token: str, ttl: int
) -> None:
    raise NotImplementedError


async def verify_mfa_challenge(
    user_id: str, challenge_token: str
) -> bool:
    raise NotImplementedError
