import type { TokenPayload } from "@aiscreener/shared-types";

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  return atob(padded);
}

export function decodeToken(token: string): TokenPayload {
  const [, payload] = token.split(".");
  return JSON.parse(base64UrlDecode(payload)) as TokenPayload;
}

export function getTokenExpiry(token: string): Date {
  return new Date(decodeToken(token).exp * 1000);
}

export function isTokenExpired(token: string): boolean {
  return getTokenExpiry(token).getTime() <= Date.now();
}

export function getTokenTimeToExpiry(token: string): number {
  return getTokenExpiry(token).getTime() - Date.now();
}
