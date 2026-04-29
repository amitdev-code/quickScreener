import type { AxiosInstance } from "axios";
import type { AuthStore } from "../../features/auth/auth.store";
import { getAccessToken, getRefreshToken } from "./token-storage";

export function setupAuthInterceptors(
  axiosInstance: AxiosInstance,
  getStore: () => AuthStore,
): void {
  let isRefreshing = false;
  let waitQueue: Array<(token: string) => void> = [];

  axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      if (error.response?.status !== 401 || original._retry || !getRefreshToken()) {
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve) => {
          waitQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await getStore().refreshToken();
        // Read from token-storage, not from a stale store snapshot.
        const newToken = getAccessToken()!;
        waitQueue.forEach((cb) => cb(newToken));
        waitQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      } catch {
        waitQueue = [];
        getStore().clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
  );
}
