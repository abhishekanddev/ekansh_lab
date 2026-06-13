import { PageHeader } from "./PageHeader";

/** Temporary placeholder for screens not yet built in this phase. */
export function Stub({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <PageHeader title={title} description={note || "Coming up in this build phase."} />
      <div className="card p-10 grid place-items-center text-[var(--color-muted)] text-sm">
        🚧 {title} — under construction
      </div>
    </div>
  );
}
