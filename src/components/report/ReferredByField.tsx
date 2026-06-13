import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Plus, Stethoscope, User } from "lucide-react";
import { useReferrers, useAddReferrer } from "../../hooks/useLabData";
import type { Referrer } from "../../lib/types";

/** Synthetic SELF entry, always available even before any referrer is saved. */
const SELF: Referrer = { id: "SELF", name: "SELF", isSelf: true };

/** Human-readable display name for a referrer — mirrors Flutter ReferrerModel. */
export function referrerDisplayName(r: Referrer): string {
  if (r.isSelf) return "SELF";
  if (r.specialization) return `Dr. ${r.name} (${r.specialization})`;
  return `Dr. ${r.name}`;
}

/**
 * Autocomplete for selecting a referrer (doctor) — search-as-you-type from the
 * `referrers` collection, SELF quick-select, and inline "Add New Doctor".
 * Ports `referred_by_field.dart`. Closes on outside-click (not blur) so the
 * dropdown no longer flickers when interacting with it.
 */
export function ReferredByField({
  selected,
  onSelect,
}: {
  selected: Referrer | null;
  onSelect: (r: Referrer | null) => void;
}) {
  const referrers = useReferrers();
  const addReferrer = useAddReferrer();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close when clicking anywhere outside the field/dropdown.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const options = useMemo(() => {
    const list = referrers.data ?? [];
    const hasSelf = list.some((r) => r.isSelf);
    const withSelf = hasSelf ? list : [SELF, ...list];
    const ql = q.trim().toLowerCase();
    if (!ql) return withSelf;
    return withSelf.filter((r) => referrerDisplayName(r).toLowerCase().includes(ql) || (r.name ?? "").toLowerCase().includes(ql));
  }, [referrers.data, q]);

  function choose(r: Referrer) {
    onSelect(r);
    setQ("");
    setOpen(false);
    setAdding(false);
  }

  function clear() {
    onSelect(null);
    setQ("");
  }

  return (
    <div className="relative" ref={wrapRef}>
      <label className="label">Referred by (Doctor)</label>
      <div className="relative">
        <input
          className="input pr-9"
          value={selected ? referrerDisplayName(selected) : q}
          placeholder="Search or type doctor name…"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => { onSelect(null); setQ(e.target.value); setOpen(true); }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]">
          {selected ? (
            <button type="button" onClick={clear} title="Clear"><X size={16} /></button>
          ) : (
            <Search size={16} />
          )}
        </span>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-[260px] overflow-y-auto card p-0 shadow-lg">
          {adding ? (
            <AddDoctorForm
              busy={addReferrer.isPending}
              onCancel={() => setAdding(false)}
              onAdd={async (data) => {
                const id = await addReferrer.mutateAsync(data);
                choose({ id, ...data });
              }}
            />
          ) : (
            <>
              {referrers.isLoading && <div className="px-4 py-3 text-[13px] text-[var(--color-muted)]">Loading…</div>}
              {options.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => choose(r)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-bg)] border-b border-[var(--color-border)] last:border-0"
                >
                  <span className="w-8 h-8 grid place-items-center rounded-md bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">
                    {r.isSelf ? <User size={15} /> : <Stethoscope size={15} />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[13px] font-medium">{r.isSelf ? "SELF" : r.name}</span>
                    {!r.isSelf && r.specialization && <span className="block text-[11px] text-[var(--color-muted)]">{r.specialization}</span>}
                  </span>
                  {r.isSelf && <span className="badge bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-[10px]">Quick</span>}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--color-bg)] text-[var(--color-primary-600)] font-medium text-[13px]"
              >
                <span className="w-8 h-8 grid place-items-center rounded-md bg-[var(--color-primary-50)]"><Plus size={15} /></span>
                Add New Doctor
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AddDoctorForm({
  busy,
  onAdd,
  onCancel,
}: {
  busy: boolean;
  onAdd: (r: Omit<Referrer, "id">) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [spec, setSpec] = useState("");
  const [phone, setPhone] = useState("");
  const [reg, setReg] = useState("");

  return (
    <div className="p-3 space-y-2">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">Add new doctor</div>
      <input className="input h-9" placeholder="Doctor name *" value={name} autoFocus onChange={(e) => setName(e.target.value)} />
      <input className="input h-9" placeholder="Specialization" value={spec} onChange={(e) => setSpec(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className="input h-9" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="input h-9" placeholder="Reg. number" value={reg} onChange={(e) => setReg(e.target.value)} />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="btn btn-primary text-[13px]"
          disabled={!name.trim() || busy}
          onClick={() => onAdd({ name: name.trim(), specialization: spec.trim() || undefined, phone: phone.trim() || undefined, registrationNumber: reg.trim() || undefined, isSelf: false })}
        >
          {busy ? "Adding…" : "Add"}
        </button>
        <button type="button" className="btn btn-ghost text-[13px]" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
