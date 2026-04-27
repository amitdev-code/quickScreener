import random
import secrets
import string
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
import jwt as pyjwt
from pydantic import BaseModel

from app.core.config import settings


class TokenPayload(BaseModel):
    user_id: str
    tenant_id: str
    role: str
    plan: str
    token_version: int
    exp: int
    jti: str


class InterviewLinkPayload(BaseModel):
    session_id: str
    candidate_id: str
    job_id: str
    tenant_id: str
    nonce: str
    exp: int


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode()[:72], bcrypt.gensalt(settings.BCRYPT_ROUNDS)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode()[:72], hashed.encode())


def _private_key():
    from cryptography.hazmat.primitives.serialization import load_pem_private_key
    return load_pem_private_key(settings.JWT_SECRET_KEY.encode(), password=None)


def _public_key():
    from cryptography.hazmat.primitives.serialization import load_pem_public_key
    return load_pem_public_key(settings.JWT_PUBLIC_KEY.encode())


def create_access_token(data: dict, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {
        **data,
        "exp": int(expire.timestamp()),
        "jti": str(uuid4()),
    }
    return pyjwt.encode(payload, _private_key(), algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str, tenant_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "type": "refresh",
        "exp": int(expire.timestamp()),
        "jti": str(uuid4()),
    }
    return pyjwt.encode(payload, _private_key(), algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> TokenPayload:
    try:
        data = pyjwt.decode(token, _public_key(), algorithms=[settings.JWT_ALGORITHM])
        return TokenPayload(**data)
    except pyjwt.PyJWTError as exc:
        raise ValueError("Invalid token") from exc


def create_interview_link_token(payload: dict, ttl_hours: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ttl_hours)
    return pyjwt.encode(
        {**payload, "exp": int(expire.timestamp())},
        _private_key(),
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_interview_link_token(token: str) -> InterviewLinkPayload:
    try:
        data = pyjwt.decode(token, _public_key(), algorithms=[settings.JWT_ALGORITHM])
        return InterviewLinkPayload(**data)
    except pyjwt.PyJWTError as exc:
        raise ValueError("Invalid interview link token") from exc


def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def create_verification_token(user_id: str, tenant_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=10)
    return pyjwt.encode(
        {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "type": "email_verify",
            "exp": int(expire.timestamp()),
            "jti": str(uuid4()),
        },
        _private_key(),
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_verification_token(token: str) -> dict:
    try:
        data = pyjwt.decode(token, _public_key(), algorithms=[settings.JWT_ALGORITHM])
        if data.get("type") != "email_verify":
            raise ValueError("Wrong token type")
        return data
    except pyjwt.PyJWTError as exc:
        raise ValueError("Invalid or expired verification token") from exc


def generate_nonce() -> str:
    return secrets.token_urlsafe(32)


async def store_nonce(nonce: str, session_id: str, ttl: int) -> None:
    raise NotImplementedError


async def consume_nonce(nonce: str) -> str | None:
    raise NotImplementedError
