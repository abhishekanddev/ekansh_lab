import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Search, Save } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ResultEntry } from "../components/report/ResultEntry";
import { LAB_TEST_TEMPLATES, TEST_CATEGORIES, type CyclePhase } from "../data/labTestTemplates";
import { buildInitialResults, genId, normalizePhone } from "../lib/reportBuilder";
import { CYCLE_PHASE_LABELS } from "../lib/labLogic";
import type { LabParameter } from "../lib/types";
import { useSaveReport, useSavePatient, useTestCatalog } from "../hooks/useLabData";
import { useAuth } from "../lib/auth";
import { serverTimestamp } from "firebase/firestore";

interface Patient {
  name: string; age: string; gender: string; phone: string;
  cyclePhase: CyclePhase; referredBy: string; uhid: string;
}

const STEPS = ["Patient & Tests", "Enter Results", "Review & Save"] as const;

export function NewReport() {
  const nav = useNavigate();
  const { user } = useAuth();
  const catalog = useTestCatalog();
  const saveReport = useSaveReport();
  const savePatient = useSavePatient();

  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient>({
    name: "", age: "", gender: "", phone: "", cyclePhase: "notApplicable", referredBy: "", uhid: "",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, LabParameter[]>>({});
  const [activeTest, setActiveTest] = useState<string>("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [saving, setSaving] = useState(false);

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

  function next() {
    if (step === 0) {
      if (!patient.name || selected.length === 0) return;
      buildResults();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  const totalPrice = selected.reduce((s, n) => s + (priceByName.get(n) ?? 0), 0);

  async function onSave() {
    setSaving(true);
    try {
      const phone = normalizePhone(patient.phone);
      const id = genId();
      const formData = { age: patient.age, gender: patient.gender, phone };
      const base = {
        id,
        patientName: patient.name,
        phone,
        referredBy: patient.referredBy,
        formData,
        price: totalPrice,
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
        });
      } else {
        const sections = selected.map((t) => ({ testType: t, results: resultsMap[t] ?? [], observation: "" }));
        const totalParams = sections.reduce((s, sec) => s + sec.results.length, 0);
        await saveReport.mutateAsync({
          ...base,
          batchId: id,
          testType: selected.join(", "),
          parameterCount: totalParams,
          sections,
        });
      }

      if (phone) {
        await savePatient.mutateAsync({
          id: phone, phone, name: patient.name, age: patient.age, gender: patient.gender,
          uhid: patient.uhid || undefined, hospitalId: user?.hospitalId ?? undefined,
          lastVisit: serverTimestamp(),
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"><input className="input" value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: e.target.value })} /></Field>
              <Field label="UHID"><input className="input" value={patient.uhid} onChange={(e) => setPatient({ ...patient, uhid: e.target.value })} /></Field>
            </div>
            <Field label="Referred by"><input className="input" value={patient.referredBy} onChange={(e) => setPatient({ ...patient, referredBy: e.target.value })} placeholder="Self / Dr. …" /></Field>
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
                return (
                  <button key={t.testName} onClick={() => toggleTest(t.testName)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border text-left text-sm ${
                      on ? "border-[var(--color-primary-300)] bg-[var(--color-primary-50)]" : "border-[var(--color-border)] hover:bg-[var(--color-bg)]"
                    }`}>
                    <span className={`w-4 h-4 grid place-items-center rounded border ${on ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)] text-white" : "border-[var(--color-border)]"}`}>
                      {on && <Check size={11} />}
                    </span>
                    <span className="flex-1">{t.testName}</span>
                    <span className="text-[11px] text-[var(--color-faint)]">{t.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          {selected.length > 1 && (
            <div className="flex gap-1 mb-4 flex-wrap">
              {selected.map((t) => (
                <button key={t} onClick={() => setActiveTest(t)}
                  className={`px-3 py-1.5 rounded-md text-[13px] font-medium ${activeTest === t ? "bg-[var(--color-primary-600)] text-white" : "bg-white border border-[var(--color-border)] text-[var(--color-muted)]"}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
          {activeTest && resultsMap[activeTest] && (
            <ResultEntry testType={activeTest} results={resultsMap[activeTest]} onChange={(next) => setResultsMap({ ...resultsMap, [activeTest]: next })} />
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
            <Dt label="Referred by" value={patient.referredBy || "—"} />
            <Dt label="Tests" value={selected.join(", ")} />
            <Dt label="Total" value={"₹" + totalPrice.toLocaleString("en-IN")} />
          </dl>
          <p className="text-[13px] text-[var(--color-muted)] mb-4">
            The report will be saved and visible in the Flutter app immediately. PDF generation is available from the report list.
          </p>
          <button className="btn btn-primary" disabled={saving} onClick={onSave}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
function Dt({ label, value }: { label: string; value: string }) {
  return <><dt className="text-[var(--color-muted)]">{label}</dt><dd className="font-medium text-right">{value}</dd></>;
}
