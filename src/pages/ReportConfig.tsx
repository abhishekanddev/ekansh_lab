import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/ui";
import { useHospitalConfig, useSaveHospitalConfig } from "../hooks/useLabData";
import type { HospitalConfig } from "../lib/types";

const FIELDS: { key: keyof HospitalConfig; label: string; section: string; placeholder?: string }[] = [
  { key: "hospital_name", label: "Lab / Hospital name", section: "Identity" },
  { key: "address", label: "Address", section: "Identity" },
  { key: "reportHeaderSubtitle", label: "Header subtitle", section: "Identity" },
  { key: "registrationNumber", label: "Registration number", section: "Identity" },
  { key: "websiteUrl", label: "Website", section: "Identity" },
  { key: "pathologistName", label: "Pathologist name", section: "Signatories" },
  { key: "pathologistQualification", label: "Pathologist qualification", section: "Signatories" },
  { key: "pathologistRegNo", label: "Pathologist reg. no.", section: "Signatories" },
  { key: "labTechnicianName", label: "Lab technician name", section: "Signatories" },
  { key: "labTechnicianQualification", label: "Technician qualification", section: "Signatories" },
  { key: "labTechnicianRegNo", label: "Technician reg. no.", section: "Signatories" },
  { key: "footerLine1", label: "Footer line 1", section: "Footer" },
  { key: "footerLine2", label: "Footer line 2", section: "Footer" },
  { key: "footerLine3", label: "Footer line 3", section: "Footer" },
  { key: "wishText", label: "Wish / thank-you text", section: "Footer" },
];

const SECTIONS = ["Identity", "Signatories", "Footer"];

export function ReportConfig() {
  const config = useHospitalConfig();
  const save = useSaveHospitalConfig();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config.data) {
      const f: Record<string, string> = {};
      for (const { key } of FIELDS) f[key as string] = (config.data[key] as string) ?? "";
      setForm(f);
    }
  }, [config.data]);

  async function onSave() {
    const patch: Partial<HospitalConfig> = {};
    for (const { key } of FIELDS) patch[key] = form[key as string] ?? "";
    await save.mutateAsync(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (config.isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        breadcrumb="Home / Report Config"
        title="Report Configuration"
        description="Branding shown on generated PDF reports. Shared with the Flutter app."
        actions={<button className="btn btn-primary" disabled={save.isPending} onClick={onSave}><Save size={16} /> {saved ? "Saved ✓" : save.isPending ? "Saving…" : "Save"}</button>}
      />

      <div className="space-y-5 max-w-3xl">
        {SECTIONS.map((section) => (
          <div key={section} className="card p-5">
            <h3 className="font-semibold mb-3">{section}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {FIELDS.filter((f) => f.section === section).map((f) => (
                <div key={f.key as string}>
                  <label className="label">{f.label}</label>
                  <input
                    className="input"
                    value={form[f.key as string] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.key as string]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
