import React from "react";
import type { Permission } from "@aiscreener/shared-types";
import { usePermissions } from "../hooks/use-permissions";

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps): React.ReactElement | null {
  const { can } = usePermissions();
  if (!can(permission)) return fallback as React.ReactElement | null;
  return <>{children}</>;
}
