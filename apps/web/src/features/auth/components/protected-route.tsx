import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Permission, Role } from "@aiscreener/shared-types";
import { useAuthStore } from "../auth.store";
import { usePermissions } from "../hooks/use-permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  roles?: Role[];
}

export function ProtectedRoute({
  children,
  permission,
  roles,
}: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { can } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && user && !roles.includes(user.role as Role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  if (permission && !can(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
