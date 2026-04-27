import React, { useRef, useState, useEffect, ClipboardEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useVerifyEmail } from "../../features/auth/auth.queries";
import "./auth.css";
import "./verify-email.css";

const OTP_LENGTH = 6;

export default function VerifyEmailPage(): React.ReactElement {
  const navigate = useNavigate();
  const verifyMutation = useVerifyEmail();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const email = sessionStorage.getItem("verification_email") ?? "your email";
  const verificationToken = sessionStorage.getItem("verification_token") ?? "";

  useEffect(() => {
    if (!verificationToken) navigate("/register", { replace: true });
    else inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    const char = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError("");
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < OTP_LENGTH; i++) {
      next[i] = pasted[i] ?? "";
    }
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Enter all 6 characters");
      return;
    }
    try {
      await verifyMutation.mutateAsync({ verification_token: verificationToken, otp });
      sessionStorage.removeItem("verification_token");
      sessionStorage.removeItem("verification_email");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? "Incorrect or expired code. Try again.";
      setError(msg);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  }

  const isFilled = digits.every((d) => d !== "");

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-box">
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a 6-character code to <strong>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="otp-row">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={d}
                  className={`otp-box${error ? " otp-box--error" : ""}`}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  autoComplete="off"
                />
              ))}
            </div>

            {error && <p className="field-error" style={{ textAlign: "center", marginTop: "0.5rem" }}>{error}</p>}

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: "1.5rem" }}
              disabled={!isFilled || verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Verifying…" : "Verify & continue"}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: "1rem" }}>
            Didn't get a code?{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => navigate("/register")}
            >
              Try again
            </button>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-logo">a.</div>
        <p className="auth-tagline">
          Be a Part of Something
          <strong>Beautiful</strong>
        </p>
      </div>
    </div>
  );
}
