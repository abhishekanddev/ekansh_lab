import type { ReactNode } from "react";

export function KpiTile({
  label, value, sub, icon, tone = "blue",
}: {
  label: string; value: ReactNode; sub?: string; icon: ReactNode;
  tone?: "blue" | "green" | "amber" | "cyan" | "purple";
}) {
  const tones: Record<string, string> = {
    blue: "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]",
    green: "bg-green-50 text-[var(--color-success)]",
    amber: "bg-amber-50 text-[var(--color-warning)]",
    cyan: "bg-cyan-50 text-[var(--color-info)]",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <span className="text-[12px] text-[var(--color-muted)]">{label}</span>
        <span className={`w-[30px] h-[30px] grid place-items-center rounded-lg ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="num text-[27px] font-bold mt-1.5 leading-none">{value}</div>
      {sub && <div className="text-[11px] text-[var(--color-faint)] mt-1.5">{sub}</div>}
    </div>
  );
}

export function FlagBadge({ flag }: { flag?: string | null }) {
  if (!flag) return null;
  const map: Record<string, string> = {
    H: "bg-red-50 text-[var(--color-danger)]",
    L: "bg-blue-50 text-[var(--color-primary-600)]",
  };
  return (
    <span className={`badge ${map[flag] || "bg-[var(--color-bg)] text-[var(--color-muted)]"}`}>
      {flag === "H" ? "↑ High" : flag === "L" ? "↓ Low" : flag}
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card p-12 grid place-items-center text-center">
      <div className="text-[15px] font-semibold text-[var(--color-ink)]">{title}</div>
      {hint && <div className="text-[13px] text-[var(--color-muted)] mt-1 max-w-sm">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return <div className="py-12 grid place-items-center text-[var(--color-muted)] text-sm">{label}</div>;
}
