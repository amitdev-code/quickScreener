import React from "react";
import { useMfaEnroll, useMfaVerify } from "../auth.queries";

interface MfaVerifyFormProps {
  mode: "enroll" | "verify";
}

export function MfaVerifyForm({ mode }: MfaVerifyFormProps): React.ReactElement {
  throw new Error("Not implemented");
}
