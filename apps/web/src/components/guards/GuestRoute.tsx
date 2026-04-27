import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/auth.store";
import { getRefreshToken } from "../../lib/auth/token-storage";

interface Props {
  children: React.ReactNode;
}

/**
 * Blocks authenticated users from visiting login / register / verify-email.
 * Checks both the in-memory auth state and the persisted refresh token so
 * a hard page refresh doesn't bypass the guard.
 */
export default function GuestRoute({ children }: Props): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated || !!getRefreshToken()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
