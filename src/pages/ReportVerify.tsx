import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { ResultEntry } from "../components/report/ResultEntry";
import { InterpretationPreview } from "../components/report/InterpretationPreview";
import { useReport, useSaveReport, useActivityLogger } from "../hooks/useLabData";
import { useGenerateReportPdf } from "../hooks/usePdf";
import { computeFlag } from "../lib/labLogic";
import { generateInterpretation } from "../lib/interpretationEngine";
import type { LabParameter, LabReport } from "../lib/types";

export function ReportVerify() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, refetch } = useReport(id);
  const saveReport = useSaveReport();
  const generatePdf = useGenerateReportPdf();
  const logActivity = useActivityLogger();
  const nav = useNavigate();

  const [results, setResults] = useState<LabParameter[]>([]);
  const [observation, setObservation] = useState("");
  const [showInterp, setShowInterp] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);
  // ready = fresh data has been fetched from Firestore (not just served from cache)
  const [ready, setReady] = useState(false);
  // prevent re-seeding local state once the user has started editing
  const seeded = useRef(false);

  // Force a fresh Firestore fetch on every mount so the edit form never shows
  // stale TanStack Query cache values from a prior session.
  useEffect(() => {
    seeded.current = false;
    setReady(false);
    let live = true;
    refetch().finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isBatch = !!data?.sections?.length;
  const activeTestType = isBatch ? (data?.sections?.[activeSection].testType ?? "") : (data?.testType ?? "");

  // Seed local state once from fresh data. seeded.current prevents background
  // refetches (e.g. window-focus) from overwriting the user's in-progress edits.
  useEffect(() => {
    if (!ready || !data || seeded.current) return;
    if (data.sections?.length) {
      setResults(data.sections[0].results ?? []);
      setObservation(data.sections[0].observation ?? "");
      setShowInterp(data.sections[0].showInterpretation === true);
    } else {
      setResults(data.results ?? []);
      setObservation(data.observation ?? "");
      setShowInterp(data.showInterpretation === true);
    }
    seeded.current = true;
  }, [data, ready]);

  function switchSection(i: number) {
    if (data?.sections) {
      data.sections[activeSection] = { ...data.sections[activeSection], results, observation, showInterpretation: showInterp };
    }
    setActiveSection(i);
    setResults(data?.sections?.[i].results ?? []);
    setObservation(data?.sections?.[i].observation ?? "");
    setShowInterp(data?.sections?.[i].showInterpretation === true);
  }

  function recomputeFlags() {
    setResults((rs) => rs.map((r) => ({ ...r, flag: computeFlag(r.value, r.range) ?? r.flag ?? null })));
  }

  function autoInterpret() {
    const testType = isBatch ? data!.sections![activeSection].testType : data!.testType;
    const text = generateInterpretation(testType, results);
    if (text) setObservation((prev) => (prev ? prev + "\n\n" : "") + text);
  }

  async function onSave() {
    if (!data) return;
    setSaving(true);
    try {
      const payload: Partial<LabReport> & { id: string; createdAt?: unknown } = {
        id: data.id,
        createdAt: data.createdAt,
        pdfUrl: "", // clear old URL so the cloud function regenerates (not early-returns)
      };
      if (isBatch && data.sections) {
        const sections = data.sections.map((s, i) => (i === activeSection ? { ...s, results, observation, showInterpretation: showInterp } : s));
        payload.sections = sections;
        payload.parameterCount = sections.reduce((n, s) => n + (s.results?.length ?? 0), 0);
      } else {
        payload.results = results;
        payload.observation = observation;
        payload.showInterpretation = showInterp;
        payload.parameterCount = results.length;
      }
      await saveReport.mutateAsync(payload);
      logActivity({ action: "report_edited", target_name: data.patientName || data.testType || data.id });
      // Mark as generating so the actions sheet shows the "Generating PDF…" state,
      // same as after new report creation.
      sessionStorage.setItem("pdfGenerating", data.id);
      generatePdf.mutate(data);
      nav("/app/reports");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !ready) return <Spinner />;
  if (!data) return <EmptyState title="Report not found" action={<Link to="/app/reports" className="btn btn-secondary">Back to reports</Link>} />;

  return (
    <div>
      <Link to="/app/reports" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] hover:text-[var(--color-ink)] mb-2">
        <ArrowLeft size={15} /> Reports
      </Link>
      <PageHeader
        title={`Edit · ${data.patientName}`}
        description={data.testType}
        actions={
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={recomputeFlags}>Recompute flags</button>
            <button className="btn btn-primary" disabled={saving} onClick={onSave}><Save size={16} /> {saving ? "Saving…" : "Save"}</button>
          </div>
        }
      />

      {isBatch && (
        <div className="flex gap-1 mb-4 flex-wrap">
          {data.sections!.map((s, i) => (
            <button key={s.testType + i} onClick={() => switchSection(i)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium ${activeSection === i ? "bg-[var(--color-primary-600)] text-white" : "bg-white border border-[var(--color-border)] text-[var(--color-muted)]"}`}>
              {s.testType}
            </button>
          ))}
        </div>
      )}

      <ResultEntry testType={isBatch ? data.sections![activeSection].testType : data.testType} results={results} onChange={setResults} />

      <div className="card p-4 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[15px]">Observation / Interpretation</h3>
          <button className="btn btn-secondary h-8 px-3 text-[13px]" onClick={autoInterpret}>
            <Sparkles size={14} /> Auto-interpret
          </button>
        </div>
        <textarea
          className="input min-h-[140px] py-2 leading-relaxed"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Clinical observation / interpretation notes…"
        />

        <label className="flex items-center gap-2 mt-4 text-[13px] font-medium select-none cursor-pointer">
          <input type="checkbox" checked={showInterp} onChange={(e) => setShowInterp(e.target.checked)} />
          Include interpretation in PDF
        </label>

        {showInterp && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 mt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-faint)] mb-2">
              Interpretation preview
            </div>
            <InterpretationPreview testType={activeTestType} results={results} />
          </div>
        )}
      </div>
    </div>
  );
}
