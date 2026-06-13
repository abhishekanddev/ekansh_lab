import { useEffect, useRef, useState } from "react";
import { Save, Building2, FileText, UserRound, FlaskConical, AlignLeft, Receipt, Sparkles, Upload, X } from "lucide-react";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/ui";
import { useHospitalConfig, useSaveHospitalConfig } from "../hooks/useLabData";
import { useHospitalId } from "../lib/auth";
import { storage } from "../lib/firebase";

/**
 * Report configuration — writes the SAME snake_case fields the Flutter
 * `lab_report_config_screen.dart` writes to `hospitals/{hid}`, so branding
 * is fully shared between web and mobile and renders on generated PDFs.
 */

type LayoutMode = "digital" | "image" | "preprinted";
type Form = Record<string, string | number | boolean | undefined>;

export function ReportConfig() {
  const config = useHospitalConfig();
  const save = useSaveHospitalConfig();
  const [form, setForm] = useState<Form>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config.data) setForm({ ...config.data } as Form);
  }, [config.data]);

  const set = (key: string, value: Form[string]) => setForm((f) => ({ ...f, [key]: value }));
  const str = (key: string) => (form[key] as string) ?? "";
  const layout = (form.report_layout_mode as LayoutMode) || "digital";

  const num = (key: string, fallback?: number) => {
    const v = form[key];
    if (v === "" || v === undefined || v === null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  async function onSave() {
    const patch: Form = {
      ...form,
      report_layout_mode: layout,
      use_manual_header_footer: layout === "image",
      enable_gst: !!form.enable_gst,
      gst_percentage: num("gst_percentage"),
      invoice_prefix: str("invoice_prefix").trim() || "INV",
      // Preprinted margins/toggles — stored as numbers/bools to match Flutter.
      preprinted_top_mm: num("preprinted_top_mm", 55),
      preprinted_bottom_mm: num("preprinted_bottom_mm", 35),
      preprinted_left_mm: num("preprinted_left_mm", 12),
      preprinted_right_mm: num("preprinted_right_mm", 12),
      preprinted_first_page_top_mm: num("preprinted_first_page_top_mm"),
      preprinted_show_signatures: form.preprinted_show_signatures !== false,
      preprinted_show_page_numbers: form.preprinted_show_page_numbers !== false,
    };
    await save.mutateAsync(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (config.isLoading) return <Spinner />;

  const field = (key: string, label: string, placeholder = "", opts: { col?: boolean; type?: string } = {}) => (
    <div key={key} className={opts.col ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      <input className="input" type={opts.type ?? "text"} value={str(key)} placeholder={placeholder} onChange={(e) => set(key, e.target.value)} />
    </div>
  );

  return (
    <div>
      <PageHeader
        breadcrumb="Home / Report Settings"
        title="Report Settings"
        description="Branding, signatories, layout and billing — shared with the Flutter app and printed on PDFs."
        actions={<button className="btn btn-primary" disabled={save.isPending} onClick={onSave}><Save size={16} /> {saved ? "Saved ✓" : save.isPending ? "Saving…" : "Save"}</button>}
      />

      <div className="space-y-4 max-w-3xl">
        <Card icon={<Building2 size={17} />} title="Lab Profile">
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-start">
            <div className="grid gap-3">
              {field("name", "Lab name", "e.g. City Diagnostics & Pathology")}
              {field("address", "Address", "e.g. 12, Civil Lines, Hardoi, UP – 241001", { col: true })}
            </div>
            <div className="w-40">
              <ImageUpload label="Logo" field="logo_url" url={str("logo_url")} onChange={(u) => set("logo_url", u)} />
            </div>
          </div>
        </Card>

        <Card icon={<FileText size={17} />} title="Report Layout">
          <LayoutSelector value={layout} onChange={(v) => set("report_layout_mode", v)} />
          {layout === "image" && (
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <ImageUpload label="Header image" field="header_image_url" url={str("header_image_url")} onChange={(u) => set("header_image_url", u)} />
              <ImageUpload label="Footer image" field="footer_image_url" url={str("footer_image_url")} onChange={(u) => set("footer_image_url", u)} />
            </div>
          )}
          {layout === "preprinted" && (
            <div className="mt-4">
              <p className="text-[12px] text-[var(--color-muted)] mb-2">Distances from each paper edge to the blank area on your letterhead (mm).</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {field("preprinted_top_mm", "Top", "55", { type: "number" })}
                {field("preprinted_bottom_mm", "Bottom", "35", { type: "number" })}
                {field("preprinted_left_mm", "Left", "12", { type: "number" })}
                {field("preprinted_right_mm", "Right", "12", { type: "number" })}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                {field("preprinted_first_page_top_mm", "First-page top (mm)", "Same as top if blank", { type: "number" })}
              </div>
              <div className="mt-3 space-y-3">
                <Toggle label="Print signatures" subtitle="Off if your letterhead already has them" value={form.preprinted_show_signatures !== false} onChange={(v) => set("preprinted_show_signatures", v)} />
                <Toggle label="Print page numbers" subtitle='"Page 1 of N" on each page' value={form.preprinted_show_page_numbers !== false} onChange={(v) => set("preprinted_show_page_numbers", v)} />
              </div>
            </div>
          )}
        </Card>

        <Card icon={<FileText size={17} />} title="Header Details" subtitle="Shown on digital/automated reports">
          <div className="grid sm:grid-cols-2 gap-3">
            {field("report_header_subtitle", "Subtitle / tagline", "Pathology & Diagnostic Laboratory", { col: true })}
            {field("registration_number", "Registration no.", "Regd. No.: XXXX54826XX")}
            {field("contact_number", "Contact", "9876543210")}
            {field("email", "Email", "lab@example.com")}
            {field("website_url", "Website", "www.mylab.com")}
          </div>
        </Card>

        <Card icon={<UserRound size={17} />} title="Pathologist" subtitle="Signatory printed on every report">
          <div className="grid sm:grid-cols-2 gap-3">
            {field("pathologist_name", "Name", "Dr. John Doe")}
            {field("pathologist_qualification", "Qualification", "MD Pathologist")}
            {field("pathologist_reg_no", "MCI / Council reg. no.", "UP-12345")}
          </div>
          <div className="mt-3 max-w-xs">
            <ImageUpload label="Signature" field="pathologist_signature_url" url={str("pathologist_signature_url")} onChange={(u) => set("pathologist_signature_url", u)} />
          </div>
        </Card>

        <Card icon={<FlaskConical size={17} />} title="Lab Technician">
          <div className="grid sm:grid-cols-2 gap-3">
            {field("lab_technician_name", "Name", "Mr. Smith")}
            {field("lab_technician_qualification", "Qualification", "DMLT")}
            {field("lab_technician_reg_no", "Reg. no.", "DMLT-UP-123")}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <ImageUpload label="Signature" field="technician_signature_url" url={str("technician_signature_url")} onChange={(u) => set("technician_signature_url", u)} />
            <ImageUpload label="Stamp / Seal" field="stamp_image_url" url={str("stamp_image_url")} onChange={(u) => set("stamp_image_url", u)} />
          </div>
        </Card>

        <Card icon={<AlignLeft size={17} />} title="Footer Lines" subtitle="Printed at the bottom of automated reports">
          <div className="grid gap-3">
            {field("footer_line_1", "Line 1 (dark banner)", "NOT VALID FOR MEDICO LEGAL PURPOSE", { col: true })}
            {field("footer_line_2", "Line 2", "For Home Collection: 9794423233", { col: true })}
            {field("footer_line_3", "Line 3 (fine print)", "Please correlate clinically…", { col: true })}
            {field("report_disclaimer", "Report disclaimer", "Results relate only to the sample tested…", { col: true })}
          </div>
        </Card>

        <Card icon={<Receipt size={17} />} title="Billing">
          <Toggle label="Enable GST" subtitle="Add GST fields to invoices" value={!!form.enable_gst} onChange={(v) => set("enable_gst", v)} />
          {!!form.enable_gst && (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {field("gst_number", "GST number", "09AAACR5055K1ZK")}
              {field("gst_percentage", "GST %", "18", { type: "number" })}
            </div>
          )}
          <div className="mt-3 max-w-xs">{field("invoice_prefix", "Invoice prefix", "INV")}</div>
        </Card>

        <Card icon={<Sparkles size={17} />} title="Extras">
          <div className="grid gap-3">{field("wish_text", "Custom wish text", "Wishing you a speedy recovery…", { col: true })}</div>
        </Card>
      </div>
    </div>
  );
}

function Card({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 grid place-items-center rounded-md bg-[var(--color-primary-50)] text-[var(--color-primary-600)]">{icon}</span>
        <div>
          <h3 className="font-semibold text-[15px] leading-tight">{title}</h3>
          {subtitle && <p className="text-[12px] text-[var(--color-muted)]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function LayoutSelector({ value, onChange }: { value: LayoutMode; onChange: (v: LayoutMode) => void }) {
  const opts: { v: LayoutMode; label: string; help: string }[] = [
    { v: "digital", label: "Digital", help: "Auto-generated header & footer with lab name, address and signatures. Best for digital sharing or plain paper." },
    { v: "image", label: "Image", help: "Uses your uploaded header/footer images embedded into the PDF." },
    { v: "preprinted", label: "Preprinted", help: "PDF contains only data — margins below align it with your physical letterhead." },
  ];
  return (
    <div>
      <div className="flex gap-2">
        {opts.map((o) => (
          <button key={o.v} type="button" onClick={() => onChange(o.v)}
            className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium border ${value === o.v ? "border-[var(--color-primary-400)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]" : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-bg)]"}`}>
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-[var(--color-muted)] mt-2">{opts.find((o) => o.v === value)?.help}</p>
    </div>
  );
}

function Toggle({ label, subtitle, value, onChange }: { label: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="w-full flex items-center gap-3 text-left">
      <div className="flex-1">
        <div className="text-[13.5px] font-medium">{label}</div>
        <div className="text-[12px] text-[var(--color-muted)]">{subtitle}</div>
      </div>
      <span className={`w-10 h-6 rounded-full p-0.5 transition ${value ? "bg-[var(--color-primary-600)]" : "bg-[var(--color-border)]"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white transition ${value ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function ImageUpload({ label, field, url, onChange }: { label: string; field: string; url: string; onChange: (url: string) => void }) {
  const hid = useHospitalId();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(file?: File) {
    if (!file || !storage || !hid) return;
    setBusy(true);
    try {
      const path = `hospitals/${hid}/branding/${field}_${Date.now()}.${file.name.split(".").pop() || "png"}`;
      const r = storageRef(storage, path);
      await uploadBytes(r, file);
      onChange(await getDownloadURL(r));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative h-20 rounded-md border border-dashed border-[var(--color-border)] grid place-items-center overflow-hidden bg-[var(--color-bg)]">
        {url ? (
          <>
            <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
            <button type="button" onClick={() => onChange("")} className="absolute top-1 right-1 w-5 h-5 grid place-items-center rounded-full bg-[var(--color-danger)] text-white"><X size={12} /></button>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="flex flex-col items-center gap-1 text-[var(--color-primary-600)] text-[12px]">
            <Upload size={18} /> {busy ? "Uploading…" : "Upload"}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    </div>
  );
}
