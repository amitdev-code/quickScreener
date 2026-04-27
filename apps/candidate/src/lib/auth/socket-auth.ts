import type { SocketOptions } from "socket.io-client";

interface SocketAuthObject {
  token: string;
}

export function getSocketAuthObject(): SocketAuthObject | null {
  throw new Error("Not implemented");
}

export function buildInterviewSocketOptions(): Partial<SocketOptions> {
  throw new Error("Not implemented");
}
