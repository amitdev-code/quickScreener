from fastapi import APIRouter, Depends

from app.api.v1.auth.schemas import (
    InterviewLinkVerifyRequest,
    InterviewLinkVerifyResponse,
    LoginRequest,
    LoginResponse,
    MeResponse,
    MFAEnrollRequest,
    MFAEnrollResponse,
    MFAVerifyRequest,
    MFAVerifyResponse,
    PasswordResetCompleteRequest,
    PasswordResetRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
)
from app.api.v1.auth.service import AuthService
from app.core.rbac import get_current_user, UserContext

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(
    payload: RegisterRequest,
    service: AuthService = Depends(),
) -> RegisterResponse:
    return await service.register(payload)


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    service: AuthService = Depends(),
) -> LoginResponse:
    return await service.login(
        email=payload.email,
        password=payload.password,
        tenant_id=payload.tenant_id,
    )


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    payload: VerifyEmailRequest,
    service: AuthService = Depends(),
) -> VerifyEmailResponse:
    return await service.verify_email(payload.verification_token, payload.otp)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    payload: RefreshRequest,
    service: AuthService = Depends(),
) -> RefreshResponse:
    raise NotImplementedError


@router.post("/logout", status_code=204)
async def logout(
    service: AuthService = Depends(),
    current_user: UserContext = Depends(get_current_user),
) -> None:
    raise NotImplementedError


@router.post("/logout-all", status_code=204)
async def logout_all(
    service: AuthService = Depends(),
    current_user: UserContext = Depends(get_current_user),
) -> None:
    raise NotImplementedError


@router.get("/me", response_model=MeResponse)
async def me(
    service: AuthService = Depends(),
    current_user: UserContext = Depends(get_current_user),
) -> MeResponse:
    raise NotImplementedError


@router.post("/mfa/enroll", response_model=MFAEnrollResponse)
async def mfa_enroll(
    payload: MFAEnrollRequest,
    service: AuthService = Depends(),
    current_user: UserContext = Depends(get_current_user),
) -> MFAEnrollResponse:
    raise NotImplementedError


@router.post("/mfa/verify", response_model=MFAVerifyResponse)
async def mfa_verify(
    payload: MFAVerifyRequest,
    service: AuthService = Depends(),
    current_user: UserContext = Depends(get_current_user),
) -> MFAVerifyResponse:
    raise NotImplementedError


@router.post("/password/reset-request", status_code=204)
async def password_reset_request(
    payload: PasswordResetRequest,
    service: AuthService = Depends(),
) -> None:
    raise NotImplementedError


@router.post("/password/reset", status_code=204)
async def password_reset(
    payload: PasswordResetCompleteRequest,
    service: AuthService = Depends(),
) -> None:
    raise NotImplementedError


@router.post("/interview-link/verify", response_model=InterviewLinkVerifyResponse)
async def interview_link_verify(
    payload: InterviewLinkVerifyRequest,
    service: AuthService = Depends(),
) -> InterviewLinkVerifyResponse:
    raise NotImplementedError
