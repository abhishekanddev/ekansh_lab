import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Search, Save, UserCheck, Plus, X } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ResultEntry } from "../components/report/ResultEntry";
import { InterpretationPreview } from "../components/report/InterpretationPreview";
import { ReferredByField, referrerDisplayName } from "../components/report/ReferredByField";
import { LAB_TEST_TEMPLATES, TEST_CATEGORIES, type CyclePhase } from "../data/labTestTemplates";
import { buildInitialResults, genId, normalizePhone } from "../lib/reportBuilder";
import { createVerificationEntry } from "../lib/verification";
import { CYCLE_PHASE_LABELS } from "../lib/labLogic";
import type { LabParameter, Referrer } from "../lib/types";
import { useSaveReport, useUpsertPatientUhid, usePatientByPhone, useTestCatalog, useSaveCatalogPrice } from "../hooks/useLabData";
import { useSubscription } from "../hooks/useSubscription";
import { canCreateReport, isExpired, remainingReports, TIER_LABEL } from "../lib/subscription";
import { useAuth } from "../lib/auth";
import { serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

interface Patient {
  name: string; age: string; gender: string; phone: string;
  cyclePhase: CyclePhase; uhid: string;
}

const STEPS = ["Patient & Tests", "Enter Results", "Review & Save"] as const;

export function NewReport() {
  const nav = useNavigate();
  const { user } = useAuth();
  const catalog = useTestCatalog();
  const saveReport = useSaveReport();
  const upsertPatient = useUpsertPatientUhid();
  const saveCatalogPrice = useSaveCatalogPrice();
  const { data: sub } = useSubscription();
  const quotaBlocked = !!sub && !canCreateReport(sub);
  const quotaReason = sub
    ? isExpired(sub)
      ? `Your ${TIER_LABEL[sub.tier]} subscription has expired. Please renew to create more reports.`
      : `You've hit today's report limit on the ${TIER_LABEL[sub.tier]} plan. Upgrade or try again tomorrow.`
    : "";

  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient>({
    name: "", age: "", gender: "", phone: "", cyclePhase: "notApplicable", uhid: "",
  });
  const [referrer, setReferrer] = useState<Referrer | null>(null);

  // ── Existing-patient lookup by phone (mirrors Flutter getPatientByPhone) ──
  const existing = usePatientByPhone(patient.phone);
  const [appliedPhone, setAppliedPhone] = useState("");
  useEffect(() => {
    const found = existing.data;
    const clean = normalizePhone(patient.phone);
    if (found && clean.length === 10 && appliedPhone !== clean) {
      setPatient((p) => ({
        ...p,
        name: p.name || found.name || "",
        age: p.age || (found.age ?? ""),
        gender: p.gender || (found.gender ?? ""),
        uhid: found.uhid ?? p.uhid,
      }));
      setAppliedPhone(clean);
    }
  }, [existing.data, patient.phone, appliedPhone]);
  const [selected, setSelected] = useState<string[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, LabParameter[]>>({});
  /** Per-test "Include interpretation in PDF" toggle. Default true, matches Flutter. */
  const [showInterpMap, setShowInterpMap] = useState<Record<string, boolean>>({});
  /** Per-test free-text Observation / Notes (mirrors mobile observation field). */
  const [observationMap, setObservationMap] = useState<Record<string, string>>({});
  const [activeTest, setActiveTest] = useState<string>("");
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [saving, setSaving] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [addQ, setAddQ] = useState("");

  const priceByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of catalog.data ?? []) m.set(c.testName, c.price ?? 0);
    return m;
  }, [catalog.data]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return LAB_TEST_TEMPLATES.filter(
      (t) => (cat === "All" || t.category === cat) && (!ql || t.testName.toLowerCase().includes(ql)),
    );
  }, [q, cat]);

  function toggleTest(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function buildResults() {
    const map: Record<string, LabParameter[]> = {};
    for (const name of selected) {
      const tpl = LAB_TEST_TEMPLATES.find((t) => t.testName === name);
      if (tpl) map[name] = buildInitialResults(tpl, patient.gender, patient.cyclePhase);
    }
    setResultsMap(map);
    setActiveTest(selected[0] ?? "");
  }

  /** Add another test while already on the results step, preserving entries. */
  function addTestInFlow(name: string) {
    if (selected.includes(name)) { setActiveTest(name); return; }
    const tpl = LAB_TEST_TEMPLATES.find((t) => t.testName === name);
    if (!tpl) return;
    setSelected((prev) => [...prev, name]);
    setResultsMap((prev) => ({ ...prev, [name]: buildInitialResults(tpl, patient.gender, patient.cyclePhase) }));
    setActiveTest(name);
    setShowAddTest(false);
  }

  /** Remove a test from the in-flow selection (and its entered results). */
  function removeTestInFlow(name: string) {
    setSelected((prev) => {
      const nextSel = prev.filter((n) => n !== name);
      if (activeTest === name) setActiveTest(nextSel[0] ?? "");
      return nextSel;
    });
    setResultsMap((prev) => {
      const { [name]: _drop, ...rest } = prev;
      return rest;
    });
  }

  function next() {
    if (step === 0) {
      if (!patient.name || selected.length === 0) return;
      buildResults();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function effectivePrice(name: string) {
    return priceOverrides[name] ?? priceByName.get(name) ?? 0;
  }

const totalPrice = selected.reduce((s, n) => s + effectivePrice(n), 0);

  async function onSave() {
    if (quotaBlocked) return;
    setSaving(true);
    try {
      const phone = normalizePhone(patient.phone);
      const id = genId();

      // Upsert patient first to obtain/generate the sequential UHID (EP-0001),
      // exactly as the Flutter app does, so the report carries the same patientId.
      let uhid = patient.uhid;
      if (phone) {
        const generated = await upsertPatient.mutateAsync({
          phone, name: patient.name, age: patient.age, gender: patient.gender,
        });
        if (generated) uhid = generated;
      }

      const referredBy = referrer ? referrerDisplayName(referrer) : "";
      const testTypeLabel = selected.length === 1 ? selected[0] : selected.join(", ");

      // Register a public verification code (EP-XXXXXX) so the report's QR/code
      // resolves and matches the format the Flutter app uses.
      let verificationCode: string | undefined;
      if (user?.hospitalId) {
        try {
          verificationCode = await createVerificationEntry({
            hospitalId: user.hospitalId,
            reportId: id,
            hospitalName: user.hospitalName ?? "",
            patientName: patient.name,
            testType: testTypeLabel,
          });
        } catch { /* non-fatal — PDF falls back to a short code */ }
      }

      const formData = { age: patient.age, gender: patient.gender, phone };
      const base = {
        id,
        patientName: patient.name,
        phone,
        patientId: uhid || undefined,
        referredBy,
        referredById: referrer?.id,
        verificationCode,
        formData,
        price: totalPrice,
        testPrices: Object.fromEntries(selected.map((n) => [n, effectivePrice(n)])),
        createdAt: serverTimestamp(),
      };

      if (selected.length === 1) {
        const testType = selected[0];
        const results = resultsMap[testType] ?? [];
        await saveReport.mutateAsync({
          ...base,
          testType,
          parameterCount: results.length,
          results,
          observation: observationMap[testType] ?? "",
          showInterpretation: showInterpMap[testType] === true,
        });
      } else {
        const sections = selected.map((t) => ({
          testType: t,
          results: resultsMap[t] ?? [],
          observation: observationMap[t] ?? "",
          showInterpretation: showInterpMap[t] === true,
        }));
        const totalParams = sections.reduce((s, sec) => s + sec.results.length, 0);
        await saveReport.mutateAsync({
          ...base,
          batchId: id,
          testType: selected.join(", "),
          parameterCount: totalParams,
          sections,
        });
      }

      nav("/app/reports");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader breadcrumb="Home / Reports / New" title="New Report" description="Create a lab report in three steps." />

      {sub && (quotaBlocked || remainingReports(sub) <= 3) && (
        <div className={`rounded-lg border p-3.5 mb-5 flex items-start gap-3 text-[13px] ${
          quotaBlocked
            ? "bg-red-50 border-red-200 text-[var(--color-danger)]"
            : "bg-orange-50 border-orange-200 text-orange-800"
        }`}>
          <span className="font-semibold">{quotaBlocked ? "Cannot create report:" : "Heads up:"}</span>
          <span className="flex-1">
            {quotaBlocked
              ? quotaReason
              : `Only ${remainingReports(sub)} report${remainingReports(sub) === 1 ? "" : "s"} left today on the ${TIER_LABEL[sub.tier]} plan.`}
          </span>
          <Link to="/app/subscription" className="font-semibold underline shrink-0">View plans</Link>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium ${
              i === step ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]" :
              i < step ? "text-[var(--color-success)]" : "text-[var(--color-faint)]"
            }`}>
              <span className={`w-5 h-5 grid place-items-center rounded-full text-[11px] ${
                i < step ? "bg-[var(--color-success)] text-white" : i === step ? "bg-[var(--color-primary-600)] text-white" : "bg-[var(--color-border)] text-white"
              }`}>{i < step ? <Check size={12} /> : i + 1}</span>
              {s}
            </div>
            {i < STEPS.length - 1 && <ArrowRight size={14} className="text-[var(--color-faint)]" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Patient form */}
          <div className="card p-5 space-y-3 h-fit">
            <h3 className="font-semibold">Patient details</h3>
            {/* Phone first — entering it looks up an existing patient and prefills the rest. */}
            <Field label="Phone number">
              <div className="relative">
                <input className="input pr-9" inputMode="numeric" value={patient.phone} autoFocus onChange={(e) => setPatient({ ...patient, phone: e.target.value })} placeholder="Enter 10-digit number first" />
                {existing.isFetching && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--color-primary-300)] border-t-[var(--color-primary-600)] rounded-full animate-spin" />}
                {!existing.isFetching && normalizePhone(patient.phone).length === 10 && existing.data && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-success)]" title="Existing patient"><UserCheck size={16} /></span>
                )}
              </div>
            </Field>
            {normalizePhone(patient.phone).length === 10 && existing.data && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--color-success)] -mt-1">
                <UserCheck size={13} /> Existing patient found — details prefilled{existing.data.uhid ? ` · ${existing.data.uhid}` : ""}.
              </div>
            )}
            <Field label="Full name *"><input className="input" value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age"><input className="input" value={patient.age} onChange={(e) => setPatient({ ...patient, age: e.target.value })} /></Field>
              <Field label="Gender">
                <select className="input" value={patient.gender} onChange={(e) => setPatient({ ...patient, gender: e.target.value })}>
                  <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
            </div>
            {patient.gender === "Female" && (
              <Field label="Cycle phase (for hormone ranges)">
                <select className="input" value={patient.cyclePhase} onChange={(e) => setPatient({ ...patient, cyclePhase: e.target.value as CyclePhase })}>
                  {(Object.keys(CYCLE_PHASE_LABELS) as CyclePhase[]).map((p) => <option key={p} value={p}>{CYCLE_PHASE_LABELS[p]}</option>)}
                </select>
              </Field>
            )}
            <Field label="UHID">
              <input className="input bg-[var(--color-bg)] text-[var(--color-muted)]" value={patient.uhid} readOnly placeholder="Auto on save" title="Auto-generated (EP-0001)" />
            </Field>
            <ReferredByField selected={referrer} onSelect={setReferrer} />
          </div>

          {/* Test selection */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Select tests <span className="text-[var(--color-muted)] font-normal">({selected.length})</span></h3>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" />
                <input className="input pl-9 h-9" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="input h-9 max-w-[150px]" value={cat} onChange={(e) => setCat(e.target.value)}>
                <option>All</option>{TEST_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="max-h-[420px] overflow-y-auto -mx-1 px-1 space-y-1">
              {filtered.map((t) => {
                const on = selected.includes(t.testName);
                const price = effectivePrice(t.testName);
                return (
                  <div key={t.testName}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-sm ${
                      on ? "border-[var(--color-primary-300)] bg-[var(--color-primary-50)]" : "border-[var(--color-border)] hover:bg-[var(--color-bg)]"
                    }`}>
                    {/* Checkbox + name — clicking this area toggles the test */}
                    <button type="button" onClick={() => toggleTest(t.testName)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <span className={`w-4 h-4 shrink-0 grid place-items-center rounded border ${on ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)] text-white" : "border-[var(--color-border)]"}`}>
                        {on && <Check size={11} />}
                      </span>
                      <span className="flex-1 truncate font-medium">{t.testName}</span>
                      <span className="text-[11px] text-[var(--color-faint)] shrink-0 hidden sm:block">{t.category}</span>
                    </button>
                    {/* Price input — always visible, click without toggling the test */}
                    <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[12px] text-[var(--color-muted)]">₹</span>
                      <PriceInput
                        value={price}
                        onCommit={(v) => {
                          setPriceOverrides((p) => ({ ...p, [t.testName]: v }));
                          saveCatalogPrice.mutate({ testName: t.testName, category: t.category, price: v, isActive: true });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div className="flex gap-1.5 mb-4 flex-wrap items-center">
            {selected.map((t) => (
              <span key={t}
                className={`group inline-flex items-center gap-1.5 rounded-md text-[13px] font-medium ${activeTest === t ? "bg-[var(--color-primary-600)] text-white" : "bg-white border border-[var(--color-border)] text-[var(--color-muted)]"}`}>
                <button onClick={() => setActiveTest(t)} className="pl-3 py-1.5">{t}</button>
                {selected.length > 1 && (
                  <button onClick={() => removeTestInFlow(t)} title="Remove test"
                    className={`pr-2 py-1.5 ${activeTest === t ? "text-white/70 hover:text-white" : "text-[var(--color-faint)] hover:text-[var(--color-danger)]"}`}>
                    <X size={13} />
                  </button>
                )}
              </span>
            ))}
            <div className="relative">
              <button onClick={() => { setShowAddTest((v) => !v); setAddQ(""); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[13px] font-medium border border-dashed border-[var(--color-primary-300)] text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)]">
                <Plus size={14} /> Add test
              </button>
              {showAddTest && (
                <AddTestPicker
                  query={addQ}
                  onQuery={setAddQ}
                  excluded={selected}
                  onPick={addTestInFlow}
                  onClose={() => setShowAddTest(false)}
                />
              )}
            </div>
          </div>
          {activeTest && resultsMap[activeTest] && (
            <>
              <ResultEntry testType={activeTest} results={resultsMap[activeTest]} onChange={(next) => setResultsMap({ ...resultsMap, [activeTest]: next })} />

              {/* Observation + interpretation — mirrors the mobile report entry. */}
              <div className="card p-5 mt-5 space-y-4">
                <div>
                  <label className="label">Observation / Notes</label>
                  <textarea
                    className="input min-h-[72px] resize-y"
                    rows={2}
                    value={observationMap[activeTest] ?? ""}
                    onChange={(e) => setObservationMap({ ...observationMap, [activeTest]: e.target.value })}
                    placeholder="Optional clinical notes for this test…"
                  />
                </div>

                <label className="flex items-center gap-2 text-[13px] font-medium select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInterpMap[activeTest] === true}
                    onChange={(e) => setShowInterpMap({ ...showInterpMap, [activeTest]: e.target.checked })}
                  />
                  Include interpretation in PDF
                </label>

                {showInterpMap[activeTest] === true && (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-faint)] mb-2">
                      Interpretation preview
                    </div>
                    <InterpretationPreview testType={activeTest} results={resultsMap[activeTest]} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="card p-6 max-w-2xl">
          <h3 className="font-semibold mb-4">Review</h3>
          <dl className="grid grid-cols-2 gap-y-2 text-sm mb-5">
            <Dt label="Patient" value={patient.name} />
            <Dt label="Age / Sex" value={[patient.age, patient.gender].filter(Boolean).join(" / ") || "—"} />
            <Dt label="Phone" value={patient.phone || "—"} />
            <Dt label="Referred by" value={referrer ? referrerDisplayName(referrer) : "—"} />
            <Dt label="Tests" value={selected.join(", ")} />
            <Dt label="Total" value={"₹" + totalPrice.toLocaleString("en-IN")} />
          </dl>
          <p className="text-[13px] text-[var(--color-muted)] mb-4">
            The report will be saved and visible in the Flutter app immediately. PDF generation is available from the report list.
          </p>
          <button className="btn btn-primary" disabled={saving || quotaBlocked} onClick={onSave} title={quotaBlocked ? quotaReason : undefined}>
            <Save size={16} /> {saving ? "Saving…" : "Save report"}
          </button>
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between mt-6">
        <button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <ArrowLeft size={16} /> Back
        </button>
        {step < STEPS.length - 1 && (
          <button className="btn btn-primary" disabled={step === 0 && (!patient.name || selected.length === 0)} onClick={next}>
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Uncontrolled-style price input: user types freely, value commits to parent on blur/Enter. */
function PriceInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(value > 0 ? String(value) : "");

  // Sync if parent resets (e.g. catalog loaded after mount)
  useState(() => { if (value > 0 && draft === "") setDraft(String(value)); });

  function commit() {
    const v = parseFloat(draft.replace(/[^\d.]/g, ""));
    onCommit(isNaN(v) ? 0 : v);
    if (isNaN(v)) setDraft("");
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      className="w-16 h-7 px-1.5 rounded border border-[var(--color-border)] bg-white text-[12px] num text-right focus:outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-200)]"
      value={draft}
      placeholder="0"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") { commit(); (e.target as HTMLInputElement).blur(); } }}
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
function Dt({ label, value }: { label: string; value: string }) {
  return <><dt className="text-[var(--color-muted)]">{label}</dt><dd className="font-medium text-right">{value}</dd></>;
}

/** Searchable dropdown to add another test on the results step. */
function AddTestPicker({
  query, onQuery, excluded, onPick, onClose,
}: {
  query: string;
  onQuery: (v: string) => void;
  excluded: string[];
  onPick: (name: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  const results = useMemo(() => {
    const ql = query.trim().toLowerCase();
    return LAB_TEST_TEMPLATES.filter(
      (t) => !excluded.includes(t.testName) && (!ql || t.testName.toLowerCase().includes(ql) || t.category.toLowerCase().includes(ql)),
    ).slice(0, 50);
  }, [query, excluded]);

  return (
    <div ref={ref} className="absolute z-30 mt-1 left-0 w-[320px] card p-0 shadow-lg">
      <div className="relative border-b border-[var(--color-border)]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" />
        <input className="input pl-9 h-9 border-0 rounded-none" placeholder="Search tests to add…" value={query} autoFocus onChange={(e) => onQuery(e.target.value)} />
      </div>
      <div className="max-h-[280px] overflow-y-auto py-1">
        {results.length === 0 ? (
          <div className="px-3 py-3 text-[13px] text-[var(--color-muted)]">No more tests to add.</div>
        ) : (
          results.map((t) => (
            <button key={t.testName} onClick={() => onPick(t.testName)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-bg)]">
              <span className="flex-1">{t.testName}</span>
              <span className="text-[11px] text-[var(--color-faint)]">{t.category}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
