import React from "react";
import { z } from "zod";
import { useLogin } from "../auth.queries";

export const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenant_id: z.string().uuid(),
});

type LoginFormValues = z.infer<typeof LoginFormSchema>;

export function LoginForm(): React.ReactElement {
  throw new Error("Not implemented");
}
