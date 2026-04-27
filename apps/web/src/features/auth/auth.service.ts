import type {
  LoginResponse,
  MFAEnrollResponse,
  MFAVerifyRequest,
  RegisterRequest,
  RegisterResponse,
  TokenPair,
  UserProfile,
  VerifyEmailResponse,
} from "@aiscreener/shared-types";
import api from "../../lib/api";

export async function login(payload: {
  email: string;
  password: string;
  tenant_id: string;
}): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/v1/auth/login", payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/api/v1/auth/register", payload);
  return data;
}

export async function verifyEmail(
  verification_token: string,
  otp: string
): Promise<VerifyEmailResponse> {
  const { data } = await api.post<VerifyEmailResponse>("/api/v1/auth/verify-email", {
    verification_token,
    otp,
  });
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post("/api/v1/auth/logout", { refresh_token: refreshToken });
}

export async function logoutAll(): Promise<void> {
  await api.post("/api/v1/auth/logout-all");
}

export async function refreshTokenCall(refreshToken: string): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>("/api/v1/auth/refresh", {
    refresh_token: refreshToken,
  });
  return data;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/api/v1/auth/me");
  return data;
}

export async function enrollMfa(): Promise<MFAEnrollResponse> {
  const { data } = await api.post<MFAEnrollResponse>("/api/v1/auth/mfa/enroll");
  return data;
}

export async function verifyMfa(payload: MFAVerifyRequest): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>("/api/v1/auth/mfa/verify", payload);
  return data;
}

export async function resolveTenantId(subdomain: string): Promise<string> {
  const { data } = await api.get<{ tenant_id: string }>(
    `/api/v1/tenants/resolve?subdomain=${encodeURIComponent(subdomain)}`
  );
  return data.tenant_id;
}
