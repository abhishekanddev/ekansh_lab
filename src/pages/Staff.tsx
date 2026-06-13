import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { useStaff } from "../hooks/useLabData";

export function Staff() {
  const staff = useStaff();
  return (
    <div>
      <PageHeader breadcrumb="Home / Staff" title="Staff" description="Users with access to this lab." />
      <div className="card overflow-hidden">
        {staff.isLoading ? (
          <Spinner />
        ) : (staff.data?.length ?? 0) === 0 ? (
          <div className="p-8"><EmptyState title="No staff found" hint="Staff accounts are managed by your lab owner." /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                <th className="font-semibold px-4 py-2.5">Name</th>
                <th className="font-semibold px-4 py-2.5">Email</th>
                <th className="font-semibold px-4 py-2.5">Role</th>
                <th className="font-semibold px-4 py-2.5">Phone</th>
              </tr>
            </thead>
            <tbody>
              {staff.data!.map((s) => (
                <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                  <td className="px-4 py-3 font-medium">{s.name || "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{s.email || "—"}</td>
                  <td className="px-4 py-3"><span className="badge bg-[var(--color-primary-50)] text-[var(--color-primary-700)] capitalize">{s.role || "staff"}</span></td>
                  <td className="px-4 py-3 num text-[var(--color-muted)]">{s.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
