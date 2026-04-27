import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLogin } from "../../features/auth/auth.queries";
import * as authService from "../../features/auth/auth.service";
import "./auth.css";

interface LoginForm {
  workspace: string;
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  workspace?: string;
  email?: string;
  password?: string;
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

export default function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

  const loginMutation = useLogin();

  const [form, setForm] = useState<LoginForm>({
    workspace: "",
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  function set(field: keyof LoginForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, global: undefined }));
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.workspace.trim()) e.workspace = "Workspace is required";
    else if (!/^[a-z0-9-]+$/.test(form.workspace))
      e.workspace = "Only lowercase letters, numbers and hyphens";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      const tenantId = await authService.resolveTenantId(form.workspace);
      await loginMutation.mutateAsync({
        email: form.email,
        password: form.password,
        tenantId,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        "Invalid credentials. Please try again.";
      setErrors({ global: msg });
    }
  }

  const isLoading = loginMutation.isPending;

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-box">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Enter your credentials to get in</p>

          {errors.global && (
            <div className="auth-error-banner">{errors.global}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="workspace">Workspace</label>
              <div className={`workspace-wrap${errors.workspace ? " error-input" : ""}`}>
                <span className="workspace-prefix">app /</span>
                <input
                  id="workspace"
                  type="text"
                  placeholder="your-company"
                  autoComplete="organization"
                  value={form.workspace}
                  onChange={(e) => set("workspace", e.target.value.toLowerCase())}
                />
              </div>
              {errors.workspace && <p className="field-error">{errors.workspace}</p>}
              {!errors.workspace && (
                <p className="field-hint">The subdomain your company registered with</p>
              )}
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className={errors.email ? "error-input" : ""}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={errors.password ? "error-input" : ""}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <div className="remember-row">
              <input
                id="remember"
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => set("rememberMe", e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Login"}
            </button>
          </form>

          <p className="auth-footer">
            Not a member?{" "}
            <Link to="/register">Create an account</Link>
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
