import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Check as CheckIcon } from "lucide-react";
import type { LabParameter } from "../../lib/types";
import { computeFlag } from "../../lib/labLogic";
import { gridSummary, resultSections } from "../../lib/reportBuilder";
import { applyFormulas, formulaForParam } from "../../lib/formulas";
import { FlagBadge } from "../ui";

/**
 * Editable results table for one test. Renders parameters grouped by section,
 * with the right input per inputType, recomputes H/L flags live, and
 * auto-fills calculated parameters (MCV, LDL, Globulin, …) via the formula
 * engine whenever an input value changes.
 */
export function ResultEntry({
  results,
  onChange,
  testType,
}: {
  results: LabParameter[];
  onChange: (next: LabParameter[]) => void;
  /** Test name — used to resolve pre-calculated value formulas. */
  testType?: string | null;
}) {
  const sections = useMemo(() => resultSections(results), [results]);

  /** Commit a new results array, re-running calculated-field formulas first. */
  function commit(next: LabParameter[]) {
    onChange(applyFormulas(testType, next));
  }

  function update(index: number, patch: Partial<LabParameter>) {
    commit(results.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function setValue(index: number, value: string) {
    const r = results[index];
    const flag = r.inputType === "numeric" || r.inputType === "text" || !r.inputType ? computeFlag(value, r.range) : r.flag ?? null;
    update(index, { value, flag });
  }

  /** Edit a parameter's reference range and re-flag against the new range. */
  function setRange(index: number, range: string) {
    const r = results[index];
    const isGrid = r.inputType === "grid" || r.inputType === "sensitivityGrid";
    const flag = isGrid ? r.flag ?? null : computeFlag(r.value, range);
    update(index, { range, flag });
  }

  /** Append a custom parameter (isCustom) — mirrors Flutter's Add Parameter. */
  function addParam(p: LabParameter) {
    commit([...results, { ...p, flag: computeFlag(p.value, p.range) }]);
  }

  /** Remove a custom parameter by index. */
  function deleteParam(index: number) {
    commit(results.filter((_, i) => i !== index));
  }

  const sectionOptions = useMemo(
    () => Array.from(new Set(results.map((r) => r.section).filter((s): s is string => !!s))),
    [results],
  );

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section ?? "_root"}>
          {section && (
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-faint)] mb-2">{section}</div>
          )}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                  <th className="font-semibold px-3 py-2">Parameter</th>
                  <th className="font-semibold px-3 py-2 w-[200px]">Value</th>
                  <th className="font-semibold px-3 py-2 w-[90px]">Unit</th>
                  <th className="font-semibold px-3 py-2 w-[150px]">Reference</th>
                  <th className="font-semibold px-3 py-2 w-[90px]">Flag</th>
                  <th className="w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) =>
                  r.section === section ? (
                    <tr key={r.parameter + i} className={`border-b border-[var(--color-border)] last:border-0 ${r.isCustom ? "bg-[var(--color-primary-50)]/40" : ""}`}>
                      <td className="px-3 py-2 font-medium">
                        {r.parameter}
                        {r.isCalculated && <FxBadge testType={testType} param={r.parameter} />}
                        {r.isCustom && <span className="ml-1.5 badge bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-[10px]">custom</span>}
                      </td>
                      <td className="px-3 py-2">
                        <CellInput r={r} onValue={(v) => setValue(i, v)} onGrid={(gd, summary) => update(i, { gridData: gd, value: summary })} />
                      </td>
                      <td className="px-3 py-2 text-[var(--color-muted)] text-[13px]">{r.unit}</td>
                      <td className="px-3 py-2">
                        <RangeCell value={r.range} onChange={(v) => setRange(i, v)} />
                      </td>
                      <td className="px-3 py-2"><FlagBadge flag={r.flag} /></td>
                      <td className="px-1 py-2">
                        {r.isCustom && (
                          <button
                            type="button"
                            onClick={() => deleteParam(i)}
                            className="text-[var(--color-faint)] hover:text-[var(--color-danger)] p-1"
                            title="Remove parameter"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : null,
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <AddParamForm sections={sectionOptions} onAdd={addParam} />
    </div>
  );
}

/** Reference range cell: shows the range as text with a pencil; clicking the
 * pencil reveals an inline editor (mirrors Flutter's edit-range affordance). */
function RangeCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() {
    onChange(draft.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          className="input h-8 num text-[13px] w-[110px]"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          placeholder="e.g. 70-110"
        />
        <button type="button" onClick={save} title="Save range" className="text-[var(--color-success)] hover:opacity-70 p-0.5">
          <CheckIcon size={15} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 group">
      <span className="num text-[13px] text-[var(--color-muted)]">{value || "—"}</span>
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true); }}
        title="Edit reference range"
        className="text-[var(--color-faint)] hover:text-[var(--color-primary-600)] opacity-0 group-hover:opacity-100 p-0.5"
      >
        <Pencil size={12} />
      </button>
    </div>
  );
}

/** Inline "Add Parameter" form — mirrors Flutter's Add Parameter dialog. */
function AddParamForm({ sections, onAdd }: { sections: string[]; onAdd: (p: LabParameter) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [range, setRange] = useState("");
  const [section, setSection] = useState("");

  function reset() {
    setName(""); setValue(""); setUnit(""); setRange(""); setSection("");
  }
  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd({
      parameter: trimmed,
      value: value.trim(),
      unit: unit.trim(),
      range: range.trim(),
      section: section || undefined,
      inputType: "numeric",
      isCustom: true,
    });
    reset();
    setOpen(false);
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-secondary text-[13px]">
        <Plus size={15} /> Add parameter
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 border-[var(--color-primary-300)]">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">Add custom parameter</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Name *</label>
          <input className="input h-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sodium" autoFocus />
        </div>
        <div>
          <label className="label">Value</label>
          <input className="input h-9" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 138" />
        </div>
        <div>
          <label className="label">Unit</label>
          <input className="input h-9" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. mEq/L" />
        </div>
        <div>
          <label className="label">Range</label>
          <input className="input h-9 num" value={range} onChange={(e) => setRange(e.target.value)} placeholder="e.g. 135-145" />
        </div>
        {sections.length > 0 && (
          <div>
            <label className="label">Section</label>
            <select className="input h-9" value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">None</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary text-[13px]" disabled={!name.trim()} onClick={submit}>Add</button>
        <button type="button" className="btn btn-ghost text-[13px]" onClick={() => { reset(); setOpen(false); }}>Cancel</button>
      </div>
    </div>
  );
}

function CellInput({
  r,
  onValue,
  onGrid,
}: {
  r: LabParameter;
  onValue: (v: string) => void;
  onGrid: (gd: Record<string, Record<string, unknown>>, summary: string) => void;
}) {
  if (r.inputType === "dropdown" && r.dropdownOptions?.length) {
    return (
      <select className="input h-9" value={r.value} onChange={(e) => onValue(e.target.value)}>
        <option value="">—</option>
        {r.dropdownOptions.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  }
  if (r.inputType === "grid" && r.gridRows && r.gridColumns) {
    return <GridInput r={r} onGrid={onGrid} />;
  }
  if (r.inputType === "sensitivityGrid" && r.gridRows) {
    return <SensitivityGridInput r={r} onGrid={onGrid} />;
  }
  if (r.isCalculated) {
    return (
      <input
        className="input h-9 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-medium cursor-not-allowed"
        value={r.value}
        readOnly
        tabIndex={-1}
        placeholder="Auto"
        title="Auto-calculated from related parameters"
      />
    );
  }
  return (
    <input
      className="input h-9"
      inputMode={r.inputType === "numeric" ? "decimal" : "text"}
      value={r.value}
      onChange={(e) => onValue(e.target.value)}
      placeholder="Enter value"
    />
  );
}

/** Small ƒx marker for calculated parameters, with the formula in its tooltip. */
function FxBadge({ testType, param }: { testType?: string | null; param: string }) {
  const formula = formulaForParam(testType, param);
  const tip = formula ? `${formula.displayFormula}\n\n${formula.description}` : "Auto-calculated from related parameters in this report.";
  return (
    <span
      className="ml-1.5 inline-flex items-center rounded px-1 text-[10px] font-semibold text-[var(--color-primary-700)] bg-[var(--color-primary-50)] cursor-help align-middle"
      title={tip}
    >
      ƒx
    </span>
  );
}

function GridInput({ r, onGrid }: { r: LabParameter; onGrid: (gd: Record<string, Record<string, unknown>>, s: string) => void }) {
  const rows = r.gridRows!;
  const cols = r.gridColumns!;
  const gd = (r.gridData ?? {}) as Record<string, Record<string, unknown>>;

  function toggle(row: string, col: string) {
    const next: Record<string, Record<string, unknown>> = { ...gd, [row]: { ...(gd[row] ?? {}) } };
    // single endpoint per row: clear others, set this
    const cur = next[row][col] === true;
    for (const c of cols) next[row][c] = false;
    next[row][col] = !cur;
    onGrid(next, gridSummary(next, cols));
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-[11px] border border-[var(--color-border)] rounded">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-[var(--color-faint)]"></th>
            {cols.map((c) => (
              <th key={c} className="px-2 py-1 text-[var(--color-muted)] num">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row} className="border-t border-[var(--color-border)]">
              <td className="px-2 py-1 font-medium whitespace-nowrap">{row}</td>
              {cols.map((c) => (
                <td key={c} className="px-2 py-1 text-center">
                  <input type="checkbox" checked={gd[row]?.[c] === true} onChange={() => toggle(row, c)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SensitivityGridInput({ r, onGrid }: { r: LabParameter; onGrid: (gd: Record<string, Record<string, unknown>>, s: string) => void }) {
  const rows = r.gridRows!;
  const gd = (r.gridData ?? {}) as Record<string, Record<string, unknown>>;
  function set(row: string, val: string) {
    const next = { ...gd, [row]: { ...(gd[row] ?? {}), sensitivity: val } };
    onGrid(next, gridSummary(next, [], true));
  }
  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row} className="flex items-center gap-2">
          <span className="text-[12px] flex-1">{row}</span>
          <select className="input h-8 w-20" value={(gd[row]?.sensitivity as string) ?? ""} onChange={(e) => set(row, e.target.value)}>
            <option value="">—</option>
            <option value="S">S</option>
            <option value="I">I</option>
            <option value="R">R</option>
          </select>
        </div>
      ))}
    </div>
  );
}
