import { z } from "zod";

export const SocketAuthObjectSchema = z.object({
  token: z.string(),
});

export const SocketPermissionDeniedSchema = z.object({
  event: z.string(),
  reason: z.string(),
});

export const SocketSessionExpiredSchema = z.object({
  message: z.string(),
});

export type SocketAuthObject = z.infer<typeof SocketAuthObjectSchema>;
export type SocketPermissionDenied = z.infer<typeof SocketPermissionDeniedSchema>;
export type SocketSessionExpired = z.infer<typeof SocketSessionExpiredSchema>;
