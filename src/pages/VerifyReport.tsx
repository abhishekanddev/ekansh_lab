import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { ShieldCheck, ShieldAlert, Download, Beaker } from "lucide-react";
import { db } from "../lib/firebase";
import type { LabReport, LabParameter } from "../lib/types";
import { fmtDateTime } from "../lib/format";
import { FlagBadge } from "../components/ui";
import { resultSections } from "../lib/reportBuilder";

type State = { status: "loading" | "ok" | "notfound" | "invalid"; report?: LabReport };

/**
 * Public report verification (QR target): /verify?r=<hospitalId>/<reportId>.
 * Reads the public-readable lab_reports doc — no auth required.
 */
export function VerifyReport() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("r");
    if (!r || !r.includes("/") || !db) {
      setState({ status: "invalid" });
      return;
    }
    const [hid, reportId] = r.split("/");
    getDoc(doc(db, "hospitals", hid, "lab_reports", reportId))
      .then((snap) => {
        if (snap.exists()) setState({ status: "ok", report: { id: snap.id, ...snap.data() } as LabReport });
        else setState({ status: "notfound" });
      })
      .catch(() => setState({ status: "notfound" }));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="h-14 bg-white border-b border-[var(--color-border)] flex items-center px-5 gap-2">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--color-primary-600)] text-white"><Beaker size={17} /></span>
        <span className="font-bold">Ekansh Lab Suite</span>
        <span className="text-[12px] text-[var(--color-muted)] ml-1">· Report verification</span>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {state.status === "loading" && <div className="text-center text-[var(--color-muted)] py-16">Verifying…</div>}

        {(state.status === "notfound" || state.status === "invalid") && (
          <div className="card p-10 text-center mt-8">
            <div className="mx-auto w-12 h-12 grid place-items-center rounded-full bg-red-50 text-[var(--color-danger)] mb-4"><ShieldAlert size={26} /></div>
            <h1 className="text-lg font-bold">Report not found</h1>
            <p className="text-sm text-[var(--color-muted)] mt-2">This verification link is invalid or the report no longer exists.</p>
          </div>
        )}

        {state.status === "ok" && state.report && <ReportView report={state.report} />}
      </div>
    </div>
  );
}

function ReportView({ report }: { report: LabReport }) {
  const fd = report.formData ?? {};
  return (
    <div className="space-y-4 mt-2">
      <div className="card p-3 flex items-center gap-2 bg-green-50 border-green-200">
        <ShieldCheck size={18} className="text-[var(--color-abha)]" />
        <span className="text-[13px] font-semibold text-[var(--color-abha)]">Verified authentic report</span>
        {report.pdfUrl && (
          <a href={report.pdfUrl} target="_blank" rel="noreferrer" className="ml-auto btn btn-secondary h-8 px-3 text-[13px]">
            <Download size={14} /> PDF
          </a>
        )}
      </div>

      <div className="card p-5">
        <h1 className="text-xl font-bold">{report.patientName}</h1>
        <div className="text-[13px] text-[var(--color-muted)] mt-1">
          {[fd.age && `${fd.age} yrs`, fd.gender, report.phone].filter(Boolean).join(" · ")}
        </div>
        <div className="text-[12px] text-[var(--color-faint)] mt-1 num">
          {report.testType} · {fmtDateTime(report.createdAt)} · ID {report.id.slice(-10)}
        </div>
      </div>

      {report.sections?.length
        ? report.sections.map((s, i) => <ResultBlock key={i} title={s.testType} results={s.results ?? []} observation={s.observation} />)
        : <ResultBlock title={report.testType} results={report.results ?? []} observation={report.observation} />}
    </div>
  );
}

function ResultBlock({ title, results, observation }: { title: string; results: LabParameter[]; observation?: string }) {
  const sections = resultSections(results);
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)] font-semibold">{title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
            <th className="font-semibold px-4 py-2">Parameter</th>
            <th className="font-semibold px-4 py-2 text-right">Value</th>
            <th className="font-semibold px-4 py-2">Unit</th>
            <th className="font-semibold px-4 py-2">Reference</th>
            <th className="font-semibold px-4 py-2">Flag</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <>
              {section && (
                <tr key={"s" + section}><td colSpan={5} className="px-4 py-1.5 bg-[var(--color-bg)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">{section}</td></tr>
              )}
              {results.filter((r) => r.section === section).map((r, i) => (
                <tr key={r.parameter + i} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-2 font-medium">{r.parameter}</td>
                  <td className="px-4 py-2 text-right num font-medium">{r.value}</td>
                  <td className="px-4 py-2 text-[var(--color-muted)] text-[13px]">{r.unit}</td>
                  <td className="px-4 py-2 text-[var(--color-muted)] text-[13px] num">{r.range}</td>
                  <td className="px-4 py-2"><FlagBadge flag={r.flag} /></td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
      {observation && (
        <div className="px-4 py-3 border-t border-[var(--color-border)]">
          <div className="text-[12px] font-semibold text-[var(--color-muted)] mb-1">Interpretation</div>
          <div className="text-[13px] whitespace-pre-line leading-relaxed">{observation}</div>
        </div>
      )}
    </div>
  );
}
