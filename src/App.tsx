import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./lib/auth";
import { AppShell } from "./app/AppShell";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { VerifyReport } from "./pages/VerifyReport";
import { Dashboard } from "./pages/Dashboard";
import { TestCatalog } from "./pages/TestCatalog";
import { Patients } from "./pages/Patients";
import { PatientDetail } from "./pages/PatientDetail";
import { ReportHistory } from "./pages/ReportHistory";
import { NewReport } from "./pages/NewReport";
import { ReportVerify } from "./pages/ReportVerify";
import { Invoices } from "./pages/Invoices";
import { ReportConfig } from "./pages/ReportConfig";
import { Staff } from "./pages/Staff";
import { ActivityLog } from "./pages/ActivityLog";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid place-items-center min-h-screen text-[var(--color-muted)]">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/app/login" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/verify" element={<VerifyReport />} />
      <Route path="/app/login" element={<Login />} />

      {/* App (auth-gated, wrapped in AppShell) */}
      <Route path="/app/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/app/reports" element={<RequireAuth><ReportHistory /></RequireAuth>} />
      <Route path="/app/reports/new" element={<RequireAuth><NewReport /></RequireAuth>} />
      <Route path="/app/reports/:id/verify" element={<RequireAuth><ReportVerify /></RequireAuth>} />
      <Route path="/app/catalog" element={<RequireAuth><TestCatalog /></RequireAuth>} />
      <Route path="/app/patients" element={<RequireAuth><Patients /></RequireAuth>} />
      <Route path="/app/patients/:id" element={<RequireAuth><PatientDetail /></RequireAuth>} />
      <Route path="/app/invoices" element={<RequireAuth><Invoices /></RequireAuth>} />
      <Route path="/app/config" element={<RequireAuth><ReportConfig /></RequireAuth>} />
      <Route path="/app/staff" element={<RequireAuth><Staff /></RequireAuth>} />
      <Route path="/app/activity" element={<RequireAuth><ActivityLog /></RequireAuth>} />

      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
