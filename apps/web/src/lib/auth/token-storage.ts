const ACCESS_KEY = "ais_access";
const REFRESH_KEY = "ais_refresh";

export function saveRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_KEY);
}

// Access token lives only in memory (module-level variable) to avoid XSS exposure.
let _accessToken: string | null = null;

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function clearAccessToken(): void {
  _accessToken = null;
}
