import React from "react";
import { z } from "zod";
import { useRegister } from "../auth.queries";

export const RegisterFormSchema = z
  .object({
    company_name: z.string().min(1),
    subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/),
    full_name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    confirm_password: z.string().min(8),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export function RegisterForm(): React.ReactElement {
  throw new Error("Not implemented");
}
