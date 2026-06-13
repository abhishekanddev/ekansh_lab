import { useNavigate } from "react-router-dom";
import { Eye, Download, Send, Link2, Pencil, Receipt, X, FileText } from "lucide-react";
import { useHospitalId } from "../../lib/auth";
import type { LabReport } from "../../lib/types";

/**
 * Actions sheet for a lab report — web equivalent of Flutter's PdfActionsSheet.
 * Preview / download PDF, WhatsApp share, copy verify link, edit, and invoice.
 */
export function ReportActionsSheet({ report, onClose }: { report: LabReport; onClose: () => void }) {
  const nav = useNavigate();
  const hid = useHospitalId();

  const verifyUrl = `${window.location.origin}/verify?r=${hid}/${report.id}`;
  const pdfUrl = report.pdfUrl as string | undefined;
  const billed = !!report.invoiceId;

  function go(path: string) {
    onClose();
    nav(path);
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(verifyUrl); } catch { /* ignore */ }
    onClose();
  }

  function whatsapp() {
    const phone = (report.phone as string | undefined)?.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Hello ${report.patientName || ""}, your ${report.testType} report is ready. View it here: ${pdfUrl || verifyUrl}`,
    );
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
          <span className="w-11 h-11 grid place-items-center rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-600)]"><FileText size={22} /></span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{report.patientName || "Report"}</div>
            <div className="text-[12px] text-[var(--color-muted)] truncate flex items-center gap-2">
              <span className="truncate">{report.testType}</span>
              {billed && <span className="badge bg-[var(--color-success-50,#ecfdf5)] text-[var(--color-success)] text-[10px]">Billed</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"><X size={18} /></button>
        </div>

        <div className="py-1">
          {pdfUrl ? (
            <>
              <Action icon={<Eye size={20} />} color="#1f6feb" title="Preview report" subtitle="Open the full PDF" onClick={() => { window.open(pdfUrl, "_blank"); onClose(); }} />
              <Action icon={<Download size={20} />} color="#00535B" title="Download PDF" subtitle="Save to your device" onClick={() => { window.open(pdfUrl, "_blank"); onClose(); }} />
            </>
          ) : (
            <Action icon={<FileText size={20} />} color="#64748b" title="No PDF yet" subtitle="Open & save the report to generate its PDF" onClick={() => go(`/app/reports/${report.id}/verify`)} />
          )}
          <Action icon={<Send size={20} />} color="#25D366" title="Send via WhatsApp" subtitle="Share the report link with the patient" onClick={whatsapp} />
          <Action icon={<Link2 size={20} />} color="#2563EB" title="Copy verification link" subtitle="Patient views the report in a browser" onClick={copyLink} />
          <Action icon={<Pencil size={20} />} color="#E67E22" title="Edit report" subtitle="Modify values and re-generate the PDF" onClick={() => go(`/app/reports/${report.id}/verify`)} />

          <div className="px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">Invoice</div>
          <Action icon={<Receipt size={20} />} color="#2E7D32" title={billed ? "View billing" : "Generate invoice"} subtitle={billed ? "Open the billing page" : "Create a bill for this report"} onClick={() => go("/app/invoices")} />
        </div>
      </div>
    </div>
  );
}

function Action({ icon, color, title, subtitle, onClick }: { icon: React.ReactNode; color: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-5 py-2.5 text-left hover:bg-[var(--color-bg)]">
      <span className="w-10 h-10 grid place-items-center rounded-lg shrink-0" style={{ backgroundColor: color + "1A", color }}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-medium">{title}</span>
        <span className="block text-[11.5px] text-[var(--color-muted)] truncate">{subtitle}</span>
      </span>
    </button>
  );
}
