import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../features/auth/auth.store";
import { getRefreshToken } from "../../lib/auth/token-storage";

interface Props {
  children: React.ReactNode;
}

/**
 * Blocks unauthenticated users from accessing protected pages.
 * Falls back to checking localStorage refresh token so a page
 * refresh doesn't immediately kick the user out.
 */
export default function ProtectedRoute({ children }: Props): React.ReactElement {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated && !getRefreshToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
