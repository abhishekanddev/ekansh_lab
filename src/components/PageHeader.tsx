import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        {breadcrumb && (
          <div className="text-[12px] text-[var(--color-muted)] mb-1">{breadcrumb}</div>
        )}
        <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
        {description && <p className="text-[13px] text-[var(--color-muted)] mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
