from datetime import timedelta
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.schemas import (
    InterviewLinkVerifyResponse,
    LoginResponse,
    MFAEnrollResponse,
    RegisterRequest,
    RegisterResponse,
    TokenPair,
    UserProfile,
    VerifyEmailResponse,
)
from app.core.config import settings
from app.core.email import send_otp_email
from app.core.redis_client import delete_otp, get_otp, set_otp
from app.core.security import (
    InterviewLinkPayload,
    create_access_token,
    create_refresh_token,
    create_verification_token,
    decode_verification_token,
    generate_otp,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.repositories.tenant import TenantCreate, TenantRepository
from app.repositories.user import UserCreate, UserRepository


def _to_user_profile(user, tenant_id: UUID) -> UserProfile:
    return UserProfile(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        tenant_id=tenant_id,
        mfa_enabled=user.mfa_enabled,
        created_at=user.created_at,
    )


def _make_token_pair(user, tenant, plan: str = "GROWTH") -> TokenPair:
    access_token = create_access_token(
        data={
            "user_id": str(user.id),
            "tenant_id": str(tenant.id),
            "role": user.role,
            "plan": plan,
            "token_version": user.token_version,
        },
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(str(user.id), str(tenant.id))
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


class AuthService:
    def __init__(self, db: AsyncSession = Depends(get_db)) -> None:
        self._db = db
        self._users = UserRepository(db)
        self._tenants = TenantRepository(db)

    async def register(self, payload: RegisterRequest) -> RegisterResponse:
        existing = await self._tenants.get_by_subdomain(payload.subdomain)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Workspace URL already taken",
            )

        tenant = await self._tenants.create(
            TenantCreate(
                name=payload.company_name,
                subdomain=payload.subdomain,
                plan="GROWTH",
            )
        )
        user = await self._users.create(
            UserCreate(
                tenant_id=tenant.id,
                email=payload.email,
                hashed_password=hash_password(payload.password),
                full_name=payload.full_name,
                role="SUPER_ADMIN",
            )
        )
        # Build the token before committing — if JWT fails the transaction rolls back
        # and the user can retry without hitting a 409 on their own subdomain.
        otp = generate_otp()
        verification_token = create_verification_token(str(user.id), str(tenant.id))

        await self._db.commit()
        await self._db.refresh(tenant)
        await self._db.refresh(user)

        await set_otp(str(user.id), otp, ttl=600)
        await send_otp_email(user.email, user.full_name, otp)

        return RegisterResponse(verification_token=verification_token)

    async def login(self, email: str, password: str, tenant_id: UUID) -> LoginResponse:
        tenant = await self._tenants.get_by_id(tenant_id)
        if not tenant or not tenant.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        user = await self._users.get_by_email(tenant_id, email)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        await self._users.update_last_login(user.id)
        await self._db.commit()

        tokens = _make_token_pair(user, tenant)
        return LoginResponse(
            **tokens.model_dump(),
            user=_to_user_profile(user, tenant_id),
            mfa_required=False,
        )

    async def verify_email(self, verification_token: str, otp: str) -> VerifyEmailResponse:
        try:
            payload = decode_verification_token(verification_token)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification link. Please register again.",
            )

        user_id = payload["user_id"]
        stored_otp = await get_otp(user_id)

        if not stored_otp or stored_otp.upper() != otp.upper().strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect or expired OTP.",
            )

        await delete_otp(user_id)

        from uuid import UUID
        user = await self._users.get_by_id(UUID(user_id))
        tenant = await self._tenants.get_by_id(user.tenant_id)

        await self._db.commit()
        tokens = _make_token_pair(user, tenant)
        return VerifyEmailResponse(
            **tokens.model_dump(),
            user=_to_user_profile(user, tenant.id),
        )

    async def refresh_access_token(self, refresh_token: str) -> TokenPair:
        raise NotImplementedError

    async def revoke_refresh_token(self, refresh_token: str) -> None:
        raise NotImplementedError

    async def revoke_all_sessions(self, user_id: str) -> None:
        raise NotImplementedError

    async def get_current_user(self, access_token: str) -> UserProfile:
        raise NotImplementedError

    async def enroll_mfa(self, user_id: str) -> MFAEnrollResponse:
        raise NotImplementedError

    async def verify_mfa(self, user_id: str, totp_code: str) -> TokenPair:
        raise NotImplementedError

    async def request_password_reset(self, email: str) -> None:
        raise NotImplementedError

    async def complete_password_reset(self, reset_token: str, new_password: str) -> None:
        raise NotImplementedError

    async def generate_interview_link_jwt(
        self,
        session_id: str,
        candidate_id: str,
        job_id: str,
        tenant_id: str,
        ttl_hours: int,
    ) -> str:
        raise NotImplementedError

    async def verify_interview_link_jwt(self, token: str) -> InterviewLinkPayload:
        raise NotImplementedError
