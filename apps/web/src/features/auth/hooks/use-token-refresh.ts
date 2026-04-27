import { useEffect, useRef } from "react";
import { useAuthStore } from "../auth.store";
import { getAccessToken } from "../../../lib/auth/token-storage";
import { getTokenTimeToExpiry, isTokenExpired } from "../../../lib/auth/jwt";

const REFRESH_BEFORE_MS = 60 * 1000; // refresh 60 s before expiry

export function useTokenRefresh(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    function schedule() {
      const token = getAccessToken();
      if (!token || isTokenExpired(token)) {
        refreshToken().catch(() => {});
        return;
      }
      const delay = Math.max(getTokenTimeToExpiry(token) - REFRESH_BEFORE_MS, 0);
      timerRef.current = setTimeout(async () => {
        await refreshToken().catch(() => {});
        schedule();
      }, delay);
    }

    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, refreshToken]);
}
