import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GuestRoute from "./components/guards/GuestRoute";
import ProtectedRoute from "./components/guards/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import { useAuthInit } from "./features/auth/hooks/use-auth-init";
import { useTokenRefresh } from "./features/auth/hooks/use-token-refresh";

export default function App(): React.ReactElement {
  useAuthInit();
  useTokenRefresh();

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes — no layout shell */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify-email" element={<GuestRoute><VerifyEmailPage /></GuestRoute>} />

        {/* App routes — wrapped in sidebar + topbar shell */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/interview" element={<PlaceholderPage title="Interview" />} />
          <Route path="/insight" element={<PlaceholderPage title="Insight" />} />
          <Route path="/talent" element={<PlaceholderPage title="Talent" />} />
          <Route path="/faq" element={<PlaceholderPage title="FAQ" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }: { title: string }): React.ReactElement {
  return (
    <div style={{ padding: "2rem", color: "var(--color-text-muted)", fontSize: "var(--font-size-base)" }}>
      {title} — coming soon
    </div>
  );
}
