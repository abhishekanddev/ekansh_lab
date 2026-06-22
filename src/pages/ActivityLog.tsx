import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { useActivityLog } from "../hooks/useLabData";
import { fmtDateTime } from "../lib/format";

const ACTION_LABELS: Record<string, string> = {
  report_created: "Report created",
  report_edited: "Report edited",
  report_deleted: "Report deleted",
  price_updated: "Price updated",
  catalog_seeded: "Catalog seeded",
  invoice_created: "Invoice created",
  staff_added: "Staff added",
  permissions_updated: "Permissions updated",
};

export function ActivityLog() {
  const log = useActivityLog();
  return (
    <div>
      <PageHeader breadcrumb="Home / Activity" title="Activity Log" description="Append-only audit trail of lab actions." />
      <div className="card overflow-hidden">
        {log.isLoading ? (
          <Spinner />
        ) : (log.data?.length ?? 0) === 0 ? (
          <div className="p-8"><EmptyState title="No activity yet" hint="Actions like report creation and price changes appear here." /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                <th className="font-semibold px-4 py-2.5">Action</th>
                <th className="font-semibold px-4 py-2.5">Target</th>
                <th className="font-semibold px-4 py-2.5">By</th>
                <th className="font-semibold px-4 py-2.5">When</th>
              </tr>
            </thead>
            <tbody>
              {log.data!.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                  <td className="px-4 py-3 font-medium">{ACTION_LABELS[a.action] ?? a.action}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{a.target_name || "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{a.performed_by || "—"}</td>
                  <td className="px-4 py-3 num text-[var(--color-muted)]">{fmtDateTime(a.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
