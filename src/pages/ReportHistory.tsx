import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, FilePlus2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { ReportActionsSheet } from "../components/report/ReportActionsSheet";
import { useRecentReports } from "../hooks/useLabData";
import { fmtDateTime, fmtMoney } from "../lib/format";
import type { LabReport } from "../lib/types";

export function ReportHistory() {
  const reports = useRecentReports(200);
  const [active, setActive] = useState<LabReport | null>(null);
  const [q, setQ] = useState("");

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
        actions={<Link to="/app/reports/new" className="btn btn-primary"><FilePlus2 size={16} /> New Report</Link>}
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setActive(r)} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] cursor-pointer">
                  <td className="px-4 py-3 font-medium">{r.patientName || "—"}<div className="text-[11px] text-[var(--color-faint)] num">{r.phone}</div></td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{r.testType}</td>
                  <td className="px-4 py-3 num text-[var(--color-muted)]">{fmtDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 num text-right">{fmtMoney(r.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {active && <ReportActionsSheet report={active} onClose={() => setActive(null)} />}
    </div>
  );
}
