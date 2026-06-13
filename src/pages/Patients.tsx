import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, User } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { usePatients } from "../hooks/useLabData";
import { fmtDate } from "../lib/format";

export function Patients() {
  const patients = usePatients();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = patients.data ?? [];
    if (!ql) return list;
    return list.filter(
      (p) => p.name?.toLowerCase().includes(ql) || p.phone?.includes(ql) || p.uhid?.toLowerCase().includes(ql),
    );
  }, [q, patients.data]);

  return (
    <div>
      <PageHeader breadcrumb="Home / Patients" title="Patients" description="Lab patient registry, indexed by phone." />

      <div className="relative mb-4 max-w-[420px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" />
        <input className="input pl-9" placeholder="Search name, phone or UHID…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {patients.isLoading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No patients yet" hint="Patients are created automatically when you generate a report." />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                <th className="font-semibold px-4 py-2.5">Name</th>
                <th className="font-semibold px-4 py-2.5">Phone</th>
                <th className="font-semibold px-4 py-2.5">Age/Sex</th>
                <th className="font-semibold px-4 py-2.5">UHID</th>
                <th className="font-semibold px-4 py-2.5">Last visit</th>
                <th className="font-semibold px-4 py-2.5 text-right">Visits</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                  <td className="px-4 py-3">
                    <Link to={`/app/patients/${encodeURIComponent(p.id)}`} className="font-medium text-[var(--color-primary-600)] hover:underline inline-flex items-center gap-2">
                      <span className="w-7 h-7 grid place-items-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-600)]"><User size={14} /></span>
                      {p.name || "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 num text-[var(--color-muted)]">{p.phone}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{[p.age, p.gender].filter(Boolean).join(" / ") || "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{p.uhid || "—"}</td>
                  <td className="px-4 py-3 num text-[var(--color-muted)]">{fmtDate(p.lastVisit)}</td>
                  <td className="px-4 py-3 num text-right">{p.totalVisits ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
