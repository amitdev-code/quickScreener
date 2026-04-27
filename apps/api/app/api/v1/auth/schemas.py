from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    tenant_id: UUID
    mfa_enabled: bool
    created_at: datetime


# Register
class RegisterRequest(BaseModel):
    company_name: str
    subdomain: str
    full_name: str
    email: EmailStr
    password: str


class RegisterResponse(BaseModel):
    verification_required: bool = True
    verification_token: str


class VerifyEmailRequest(BaseModel):
    verification_token: str
    otp: str


class VerifyEmailResponse(TokenPair):
    user: UserProfile


# Login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant_id: UUID


class LoginResponse(TokenPair):
    user: UserProfile
    mfa_required: bool = False
    mfa_challenge_token: str | None = None


# Refresh
class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(TokenPair):
    pass


# Logout
class LogoutRequest(BaseModel):
    refresh_token: str


# Me
class MeResponse(UserProfile):
    pass


# MFA
class MFAEnrollRequest(BaseModel):
    pass


class MFAEnrollResponse(BaseModel):
    otpauth_uri: str
    qr_code_b64: str


class MFAVerifyRequest(BaseModel):
    totp_code: str


class MFAVerifyResponse(TokenPair):
    pass


# Password reset
class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetCompleteRequest(BaseModel):
    reset_token: str
    new_password: str


# Interview link
class InterviewLinkVerifyRequest(BaseModel):
    token: str


class InterviewLinkVerifyResponse(BaseModel):
    session_id: UUID
    candidate_id: UUID
    job_id: UUID
    tenant_id: UUID
