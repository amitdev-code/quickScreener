import { useAuthStore, type AuthStore } from "../auth.store";
import { Role } from "@aiscreener/shared-types";

interface DerivedAuthState extends AuthStore {
  isRecruiter: boolean;
  isHRManager: boolean;
  isSuperAdmin: boolean;
  isViewer: boolean;
}

export function useAuth(): DerivedAuthState {
  const store = useAuthStore();
  const role = store.user?.role as Role | undefined;
  return {
    ...store,
    isSuperAdmin: role === Role.SUPER_ADMIN,
    isHRManager: role === Role.HR_MANAGER,
    isRecruiter: role === Role.RECRUITER,
    isViewer: role === Role.VIEWER,
  };
}
