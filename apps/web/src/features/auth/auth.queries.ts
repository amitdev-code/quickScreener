import {
  useMutation,
  useQuery,
  UseMutationResult,
  UseQueryResult,
} from "@tanstack/react-query";
import type { RegisterResponse, UserProfile, VerifyEmailResponse } from "@aiscreener/shared-types";
import * as authService from "./auth.service";
import { useAuthStore } from "./auth.store";
import { setAccessToken, saveRefreshToken } from "../../lib/auth/token-storage";

export function useLogin(): UseMutationResult<
  void,
  Error,
  { email: string; password: string; tenantId: string }
> {
  const store = useAuthStore();
  return useMutation({
    mutationFn: ({ email, password, tenantId }) =>
      store.login(email, password, tenantId),
  });
}

export function useRegister(): UseMutationResult<
  RegisterResponse,
  Error,
  Parameters<typeof authService.register>[0]
> {
  return useMutation({
    mutationFn: (payload) => authService.register(payload),
  });
}

export function useVerifyEmail(): UseMutationResult<
  VerifyEmailResponse,
  Error,
  { verification_token: string; otp: string }
> {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: ({ verification_token, otp }) =>
      authService.verifyEmail(verification_token, otp),
    onSuccess: (resp) => {
      setAccessToken(resp.access_token);
      saveRefreshToken(resp.refresh_token);
      setUser(resp.user);
    },
  });
}

export function useLogout(): UseMutationResult<void, Error, void> {
  const store = useAuthStore();
  return useMutation({ mutationFn: () => store.logout() });
}

export function useRefreshToken(): UseMutationResult<void, Error, void> {
  const store = useAuthStore();
  return useMutation({ mutationFn: () => store.refreshToken() });
}

export function useMe(): UseQueryResult<UserProfile> {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["me"],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMfaEnroll(): UseMutationResult<void, Error, void> {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async () => {
      await authService.enrollMfa();
    },
  });
}

export function useMfaVerify(): UseMutationResult<void, Error, { totpCode: string }> {
  const store = useAuthStore();
  return useMutation({
    mutationFn: ({ totpCode }) => store.completeMfa(totpCode),
  });
}
