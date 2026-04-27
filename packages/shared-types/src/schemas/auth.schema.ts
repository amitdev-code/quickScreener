import { z } from "zod";

export const TokenPairSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default("bearer"),
  expires_in: z.number().int(),
});

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  role: z.string(),
  tenant_id: z.string().uuid(),
  mfa_enabled: z.boolean(),
  created_at: z.string().datetime(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenant_id: z.string().uuid(),
});

export const LoginResponseSchema = TokenPairSchema.extend({
  user: UserProfileSchema,
  mfa_required: z.boolean().default(false),
  mfa_challenge_token: z.string().nullable().optional(),
});

export const RegisterRequestSchema = z.object({
  company_name: z.string().min(1),
  subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/),
  full_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterResponseSchema = z.object({
  verification_required: z.boolean().default(true),
  verification_token: z.string(),
});

export const VerifyEmailRequestSchema = z.object({
  verification_token: z.string(),
  otp: z.string().length(6),
});

export const VerifyEmailResponseSchema = TokenPairSchema.extend({
  user: UserProfileSchema,
});

export const RefreshRequestSchema = z.object({
  refresh_token: z.string(),
});

export const RefreshResponseSchema = TokenPairSchema;

export const MFAEnrollRequestSchema = z.object({});

export const MFAEnrollResponseSchema = z.object({
  otpauth_uri: z.string().url(),
  qr_code_b64: z.string(),
});

export const MFAVerifyRequestSchema = z.object({
  totp_code: z.string().length(6),
});

export const InterviewLinkPayloadSchema = z.object({
  session_id: z.string().uuid(),
  candidate_id: z.string().uuid(),
  job_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  nonce: z.string(),
  exp: z.number().int(),
});

export const TokenPayloadSchema = z.object({
  user_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  role: z.string(),
  plan: z.string(),
  token_version: z.number().int(),
  exp: z.number().int(),
  jti: z.string(),
});

export const TenantAuthConfigSchema = z.object({
  require_mfa: z.boolean(),
  session_ttl_hours: z.number().int(),
});

export type TokenPair = z.infer<typeof TokenPairSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
export type MFAEnrollRequest = z.infer<typeof MFAEnrollRequestSchema>;
export type MFAEnrollResponse = z.infer<typeof MFAEnrollResponseSchema>;
export type MFAVerifyRequest = z.infer<typeof MFAVerifyRequestSchema>;
export type InterviewLinkPayload = z.infer<typeof InterviewLinkPayloadSchema>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type TenantAuthConfig = z.infer<typeof TenantAuthConfigSchema>;
