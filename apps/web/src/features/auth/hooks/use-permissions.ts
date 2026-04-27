import { Permission } from "@aiscreener/shared-types";
import { useAuthStore } from "../auth.store";

interface PermissionsResult {
  can: (permission: Permission) => boolean;
  canAny: (...permissions: Permission[]) => boolean;
  canAll: (...permissions: Permission[]) => boolean;
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  HR_MANAGER: Object.values(Permission).filter(
    (p) => p !== Permission.BILLING_WRITE && p !== Permission.TENANT_SETTINGS_WRITE
  ),
  RECRUITER: [
    Permission.JOB_READ,
    Permission.JOB_CREATE,
    Permission.JOB_UPDATE,
    Permission.JOB_PUBLISH,
    Permission.CANDIDATE_READ,
    Permission.CANDIDATE_CREATE,
    Permission.INTERVIEW_LINK_GENERATE,
    Permission.INTERVIEW_WATCH_LIVE,
    Permission.INTERVIEW_INJECT_QUESTION,
    Permission.INTERVIEW_TERMINATE,
    Permission.INTERVIEW_REPORT_READ,
    Permission.SCREENER_RUN,
    Permission.CRM_PIPELINE_READ,
    Permission.CRM_PIPELINE_WRITE,
    Permission.CRM_ANALYTICS_READ,
  ],
  VIEWER: [
    Permission.JOB_READ,
    Permission.CANDIDATE_READ,
    Permission.INTERVIEW_REPORT_READ,
    Permission.CRM_PIPELINE_READ,
    Permission.CRM_ANALYTICS_READ,
    Permission.TENANT_SETTINGS_READ,
    Permission.BILLING_READ,
  ],
};

export function usePermissions(): PermissionsResult {
  const role = useAuthStore((s) => s.user?.role ?? "");
  const allowed = new Set(ROLE_PERMISSIONS[role] ?? []);

  return {
    can: (p) => allowed.has(p),
    canAny: (...ps) => ps.some((p) => allowed.has(p)),
    canAll: (...ps) => ps.every((p) => allowed.has(p)),
  };
}
