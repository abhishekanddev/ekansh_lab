import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Users, IndianRupee, CalendarCheck, FilePlus2, FlaskConical, Receipt } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { KpiTile, Spinner, EmptyState } from "../components/ui";
import { ReportActionsSheet } from "../components/report/ReportActionsSheet";
import { ReportRow } from "../components/report/ReportRow";
import { useRecentReports, usePatients } from "../hooks/useLabData";
import { fmtMoney, isToday } from "../lib/format";
import { useAuth } from "../lib/auth";
import type { LabReport } from "../lib/types";

export function Dashboard() {
  const { user } = useAuth();
  const reports = useRecentReports(50);
  const patients = usePatients();
  const [active, setActive] = useState<LabReport | null>(null);

  const list = reports.data ?? [];
  const todayCount = list.filter((r) => isToday(r.createdAt)).length;
  const revenue = list.filter((r) => isToday(r.createdAt)).reduce((s, r) => s + (r.price ?? 0), 0);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  return (
    <div>
      <PageHeader
        breadcrumb="Home / Dashboard"
        title={`${greeting}, ${user?.name?.split(" ")[0] || "there"}`}
        description="Your lab at a glance."
        actions={
          <Link to="/app/reports/new" className="btn btn-primary">
            <FilePlus2 size={16} /> New Report
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiTile label="Reports today" value={todayCount} icon={<CalendarCheck size={17} />} tone="blue" />
        <KpiTile label="Today's revenue" value={fmtMoney(revenue)} icon={<IndianRupee size={17} />} tone="green" />
        <KpiTile label="Recent reports" value={list.length} sub="last 50" icon={<FileText size={17} />} tone="cyan" />
        <KpiTile label="Patients" value={patients.data?.length ?? "—"} icon={<Users size={17} />} tone="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent reports */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h2 className="font-semibold text-[15px]">Recent reports</h2>
            <Link to="/app/reports" className="text-[13px] text-[var(--color-primary-600)] hover:underline">View all</Link>
          </div>
          {reports.isLoading ? (
            <Spinner />
          ) : list.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No reports yet" hint="Create your first lab report to see it here." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                  <th className="font-semibold px-4 py-2.5">Patient</th>
                  <th className="font-semibold px-4 py-2.5">Test</th>
                  <th className="font-semibold px-4 py-2.5">Date</th>
                  <th className="font-semibold px-4 py-2.5 text-right">Amount</th>
                  <th className="w-[72px]" />
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 8).map((r) => (
                  <ReportRow key={r.id} r={r} onClick={() => setActive(r)} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-4">
          <h2 className="font-semibold text-[15px] mb-3">Quick actions</h2>
          <div className="grid gap-2">
            <QuickLink to="/app/reports/new" icon={<FilePlus2 size={17} />} label="New report" />
            <QuickLink to="/app/catalog" icon={<FlaskConical size={17} />} label="Test catalog" />
            <QuickLink to="/app/patients" icon={<Users size={17} />} label="Patients" />
            <QuickLink to="/app/invoices" icon={<Receipt size={17} />} label="Billing" />
          </div>
        </div>
      </div>

      {active && <ReportActionsSheet report={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-bg)] text-sm font-medium"
    >
      <span className="text-[var(--color-primary-600)]">{icon}</span>
      {label}
    </Link>
  );
}
