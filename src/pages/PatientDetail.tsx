import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { usePatient, usePatientReports } from "../hooks/useLabData";
import { fmtDateTime, fmtMoney } from "../lib/format";

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patient = usePatient(id);
  const p = patient.data;
  const reports = usePatientReports(p?.phone ?? id);

  if (patient.isLoading) return <Spinner />;
  if (!p) return <EmptyState title="Patient not found" />;

  return (
    <div>
      <Link to="/app/patients" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-ink)] mb-2">
        <ArrowLeft size={15} /> Patients
      </Link>
      <PageHeader title={p.name} description={[p.age && `${p.age} yrs`, p.gender, p.phone].filter(Boolean).join(" · ")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Info label="Phone" value={p.phone} />
        <Info label="UHID" value={p.uhid || "—"} />
        <Info label="Total visits" value={String(p.totalVisits ?? "—")} />
        <Info label="Reports" value={String(reports.data?.length ?? "—")} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)] font-semibold text-[15px]">Report history</div>
        {reports.isLoading ? (
          <Spinner />
        ) : (reports.data?.length ?? 0) === 0 ? (
          <div className="p-8"><EmptyState title="No reports for this patient" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                <th className="font-semibold px-4 py-2.5">Test</th>
                <th className="font-semibold px-4 py-2.5">Date</th>
                <th className="font-semibold px-4 py-2.5 text-right">Amount</th>
                <th className="font-semibold px-4 py-2.5 text-right">PDF</th>
              </tr>
            </thead>
            <tbody>
              {reports.data!.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                  <td className="px-4 py-3 font-medium inline-flex items-center gap-2"><FileText size={15} className="text-[var(--color-muted)]" />{r.testType}</td>
                  <td className="px-4 py-3 num text-[var(--color-muted)]">{fmtDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 num text-right">{fmtMoney(r.price)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.pdfUrl ? (
                      <a href={r.pdfUrl} target="_blank" rel="noreferrer" className="text-[var(--color-primary-600)] inline-flex items-center gap-1 hover:underline">
                        <Download size={14} /> Open
                      </a>
                    ) : (
                      <span className="text-[var(--color-faint)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-[12px] text-[var(--color-muted)]">{label}</div>
      <div className="text-[16px] font-semibold mt-1 num">{value}</div>
    </div>
  );
}
