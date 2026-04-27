import redis.asyncio as aioredis

from app.core.config import settings

_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


async def set_otp(key: str, otp: str, ttl: int = 600) -> None:
    r = await get_redis()
    await r.setex(f"otp:{key}", ttl, otp)


async def get_otp(key: str) -> str | None:
    r = await get_redis()
    return await r.get(f"otp:{key}")


async def delete_otp(key: str) -> None:
    r = await get_redis()
    await r.delete(f"otp:{key}")
