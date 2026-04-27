import { create } from "zustand";
import type { UserProfile } from "@aiscreener/shared-types";
import * as authService from "./auth.service";
import {
  clearAccessToken,
  clearRefreshToken,
  getRefreshToken,
  saveRefreshToken,
  setAccessToken,
} from "../../lib/auth/token-storage";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaChallengeToken: string | null;
}

interface AuthActions {
  login(email: string, password: string, tenantId: string): Promise<void>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  refreshToken(): Promise<void>;
  completeMfa(totpCode: string): Promise<void>;
  setUser(user: UserProfile): void;
  clearAuth(): void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  mfaRequired: false,
  mfaChallengeToken: null,

  async login(email, password, tenantId) {
    set({ isLoading: true });
    try {
      const resp = await authService.login({ email, password, tenant_id: tenantId });
      if (resp.mfa_required) {
        set({
          mfaRequired: true,
          mfaChallengeToken: resp.mfa_challenge_token ?? null,
          isLoading: false,
        });
        return;
      }
      setAccessToken(resp.access_token);
      saveRefreshToken(resp.refresh_token);
      set({
        user: resp.user,
        accessToken: resp.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  async logout() {
    const rt = getRefreshToken();
    if (rt) await authService.logout(rt).catch(() => {});
    clearAccessToken();
    clearRefreshToken();
    set({ user: null, accessToken: null, isAuthenticated: false, mfaRequired: false });
  },

  async logoutAll() {
    await authService.logoutAll().catch(() => {});
    clearAccessToken();
    clearRefreshToken();
    set({ user: null, accessToken: null, isAuthenticated: false, mfaRequired: false });
  },

  async refreshToken() {
    const rt = getRefreshToken();
    if (!rt) throw new Error("No refresh token");
    const tokens = await authService.refreshTokenCall(rt);
    setAccessToken(tokens.access_token);
    saveRefreshToken(tokens.refresh_token);
    set({ accessToken: tokens.access_token });
  },

  async completeMfa(totpCode) {
    set({ isLoading: true });
    try {
      const tokens = await authService.verifyMfa({ totp_code: totpCode });
      setAccessToken(tokens.access_token);
      saveRefreshToken(tokens.refresh_token);
      const user = await authService.getMe();
      set({
        user,
        accessToken: tokens.access_token,
        isAuthenticated: true,
        mfaRequired: false,
        mfaChallengeToken: null,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setUser(user) {
    set({ user, isAuthenticated: true });
  },

  clearAuth() {
    clearAccessToken();
    clearRefreshToken();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      mfaRequired: false,
      mfaChallengeToken: null,
    });
  },
}));
