import React from "react";
import { Navigate } from "react-router-dom";
import type { Permission, Role } from "@aiscreener/shared-types";
import { useAuthStore } from "../../features/auth/auth.store";
import { usePermissions } from "../../features/auth/hooks/use-permissions";

interface WithAuthOptions {
  permission?: Permission;
  roles?: Role[];
  redirectTo?: string;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: WithAuthOptions,
): React.ComponentType<P> {
  const redirectTo = options?.redirectTo ?? "/login";

  return function GuardedComponent(props: P): React.ReactElement {
    const { isAuthenticated, user } = useAuthStore();
    const { can } = usePermissions();

    if (!isAuthenticated) return <Navigate to={redirectTo} replace />;
    if (options?.roles && user && !options.roles.includes(user.role as Role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    if (options?.permission && !can(options.permission)) {
      return <Navigate to="/unauthorized" replace />;
    }
    return <Component {...props} />;
  };
}
