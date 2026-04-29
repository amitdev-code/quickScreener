import { useEffect } from "react";
import { useAuthStore } from "../auth.store";
import { getAccessToken, getRefreshToken } from "../../../lib/auth/token-storage";

// Module-level flag prevents React StrictMode's double-invoke from firing
// two concurrent initSession() calls against a single-use refresh token.
let sessionInitStarted = false;

/**
 * Runs once on app mount. If a refresh token exists in localStorage but the
 * in-memory session is empty (page was refreshed), rehydrates user + tokens.
 * Only clears auth when the server explicitly rejects the token (401/403).
 * Network errors or server being down leave the session intact so the user
 * isn't logged out due to a transient connectivity issue.
 */
export function useAuthInit(): void {
  const initSession = useAuthStore((s) => s.initSession);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    if (sessionInitStarted || getAccessToken() || !getRefreshToken()) return;

    sessionInitStarted = true;
    initSession().catch((err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        // Refresh token is genuinely expired/revoked — log out.
        clearAuth();
      }
      // Any other error (network down, 5xx) — keep the refresh token.
      // The axios interceptor will retry on the next real API call.
      sessionInitStarted = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
