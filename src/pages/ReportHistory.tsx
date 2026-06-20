import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, FilePlus2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { ReportActionsSheet } from "../components/report/ReportActionsSheet";
import { ReportRow } from "../components/report/ReportRow";
import { useRecentReports } from "../hooks/useLabData";
import { useCanWrite } from "../hooks/useSubscription";
import type { LabReport } from "../lib/types";

export function ReportHistory() {
  const reports = useRecentReports(200);
  const { canWrite, reason } = useCanWrite();
  const [active, setActive] = useState<LabReport | null>(null);
  const [q, setQ] = useState("");
  const location = useLocation();
  const nav = useNavigate();

  // After saving a new report, auto-open its actions sheet (shows PDF progress).
  // Consume the nav state once so closing the sheet doesn't re-open it.
  const openReportId = (location.state as { openReportId?: string } | null)?.openReportId;
  useEffect(() => {
    if (!openReportId) return;
    const found = reports.data?.find((r) => r.id === openReportId);
    if (found) {
      setActive(found);
      nav(location.pathname, { replace: true, state: null });
    }
  }, [openReportId, reports.data, location.pathname, nav]);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = reports.data ?? [];
    if (!ql) return list;
    return list.filter(
      (r) => r.patientName?.toLowerCase().includes(ql) || r.testType?.toLowerCase().includes(ql) || r.phone?.includes(ql),
    );
  }, [q, reports.data]);

  return (
    <div>
      <PageHeader
        breadcrumb="Home / Reports"
        title="Reports"
        description="All completed lab reports."
        actions={canWrite
          ? <Link to="/app/reports/new" className="btn btn-primary"><FilePlus2 size={16} /> New Report</Link>
          : <button className="btn btn-primary opacity-50 cursor-not-allowed" disabled title={reason ?? undefined}><FilePlus2 size={16} /> New Report</button>}
      />

      <div className="relative mb-4 max-w-[420px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" />
        <input className="input pl-9" placeholder="Search patient, test or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {reports.isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <div className="p-8"><EmptyState title="No reports found" hint="Try a different search, or create a new report." /></div>
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
              {rows.map((r) => (
                <ReportRow key={r.id} r={r} onClick={() => setActive(r)} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {active && <ReportActionsSheet report={active} onClose={() => setActive(null)} />}
    </div>
  );
}
