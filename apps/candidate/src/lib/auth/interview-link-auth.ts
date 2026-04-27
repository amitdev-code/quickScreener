import type { InterviewLinkPayload } from "@aiscreener/shared-types";

export function extractTokenFromUrl(): string | null {
  throw new Error("Not implemented");
}

export function storeSessionToken(token: string): void {
  throw new Error("Not implemented");
}

export function getSessionToken(): string | null {
  throw new Error("Not implemented");
}

export function clearSessionToken(): void {
  throw new Error("Not implemented");
}

export function decodeInterviewToken(token: string): InterviewLinkPayload {
  throw new Error("Not implemented");
}

export function isInterviewTokenExpired(token: string): boolean {
  throw new Error("Not implemented");
}
