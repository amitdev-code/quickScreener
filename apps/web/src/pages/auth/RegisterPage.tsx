import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "../../features/auth/auth.queries";
import "./auth.css";

interface RegisterForm {
  company_name: string;
  subdomain: string;
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface FormErrors {
  company_name?: string;
  subdomain?: string;
  full_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  global?: string;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#e53e3e", "#dd6b20", "#d69e2e", "#38a169"];

  return (
    <div style={{ marginTop: "0.4rem" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: i <= score ? colors[score] : "#ddd",
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: "0.75rem", color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}

export default function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [form, setForm] = useState<RegisterForm>({
    company_name: "",
    subdomain: "",
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function set(field: keyof RegisterForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "company_name") {
        next.subdomain = value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined, global: undefined }));
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.company_name.trim()) e.company_name = "Company name is required";
    if (!form.subdomain.trim()) e.subdomain = "Workspace URL is required";
    else if (!/^[a-z0-9-]+$/.test(form.subdomain))
      e.subdomain = "Only lowercase letters, numbers and hyphens";
    else if (form.subdomain.length < 3)
      e.subdomain = "At least 3 characters";
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8)
      e.password = "At least 8 characters";
    if (!form.confirm_password) e.confirm_password = "Please confirm your password";
    else if (form.password !== form.confirm_password)
      e.confirm_password = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      const resp = await registerMutation.mutateAsync({
        company_name: form.company_name,
        subdomain: form.subdomain,
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });
      sessionStorage.setItem("verification_token", resp.verification_token);
      sessionStorage.setItem("verification_email", form.email);
      navigate("/verify-email", { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        "Registration failed. Please try again.";
      setErrors({ global: msg });
    }
  }

  const isLoading = registerMutation.isPending;

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-box">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Set up your workspace in seconds</p>

          {errors.global && (
            <div className="auth-error-banner">{errors.global}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="company_name">Company name</label>
              <input
                id="company_name"
                type="text"
                placeholder="Acme Corp"
                autoComplete="organization"
                className={errors.company_name ? "error-input" : ""}
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
              />
              {errors.company_name && (
                <p className="field-error">{errors.company_name}</p>
              )}
            </div>

            <div className="field">
              <label htmlFor="subdomain">Workspace URL</label>
              <div className={`workspace-wrap${errors.subdomain ? " error-input" : ""}`}>
                <span className="workspace-prefix">app /</span>
                <input
                  id="subdomain"
                  type="text"
                  placeholder="acme-corp"
                  value={form.subdomain}
                  onChange={(e) =>
                    set("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                />
              </div>
              {errors.subdomain ? (
                <p className="field-error">{errors.subdomain}</p>
              ) : (
                <p className="field-hint">
                  Your team will log in at app/{form.subdomain || "your-company"}
                </p>
              )}
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="full_name">Full name</label>
                <input
                  id="full_name"
                  type="text"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  className={errors.full_name ? "error-input" : ""}
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                />
                {errors.full_name && (
                  <p className="field-error">{errors.full_name}</p>
                )}
              </div>

              <div className="field">
                <label htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@acme.com"
                  autoComplete="email"
                  className={errors.email ? "error-input" : ""}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className={errors.password ? "error-input" : ""}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.password ? (
                  <p className="field-error">{errors.password}</p>
                ) : (
                  <PasswordStrength password={form.password} />
                )}
              </div>

              <div className="field">
                <label htmlFor="confirm_password">Confirm password</label>
                <div className="password-wrap">
                  <input
                    id="confirm_password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={errors.confirm_password ? "error-input" : ""}
                    value={form.confirm_password}
                    onChange={(e) => set("confirm_password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="field-error">{errors.confirm_password}</p>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
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
