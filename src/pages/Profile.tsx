import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save, Mail, Building2, ShieldCheck, SlidersHorizontal, Check } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useMyProfile, useSaveMyProfile } from "../hooks/useLabData";

/**
 * Account screen — the lab owner can edit their own name / phone / designation.
 * Email, lab and role are read-only (managed by auth / onboarding). Lab branding
 * (letterhead, pathologist, signatures) lives on the Report Config page.
 */
export function Profile() {
  const { user } = useAuth();
  const profile = useMyProfile(user?.uid);
  const save = useSaveMyProfile(user?.uid);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.name ?? user?.name ?? "");
      setPhone(profile.data.phone ?? "");
      setDesignation(profile.data.designation ?? "");
    }
  }, [profile.data, user?.name]);

  async function onSave() {
    setSaved(false);
    await save.mutateAsync({ name: name.trim(), phone: phone.trim(), designation: designation.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (profile.isLoading) return <Spinner />;

  const initials = (name || user?.name || "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div>
      <PageHeader breadcrumb="Home / Account" title="My Account" description="Manage your personal details." />

      <div className="grid lg:grid-cols-3 gap-5 max-w-4xl">
        {/* Identity card */}
        <div className="card p-5 h-fit">
          <div className="flex flex-col items-center text-center">
            <span className="w-16 h-16 grid place-items-center rounded-full bg-[var(--color-primary-600)] text-white text-xl font-semibold">{initials}</span>
            <div className="font-semibold mt-3">{name || user?.name}</div>
            <div className="text-[12.5px] text-[var(--color-muted)] flex items-center gap-1.5 mt-1">
              <Mail size={13} /> {user?.email}
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] mt-4 pt-4 space-y-2.5 text-[13px]">
            <Row icon={<Building2 size={14} />} label="Lab" value={user?.hospitalName || "—"} />
            <Row icon={<ShieldCheck size={14} />} label="Status" value={user?.emailVerified ? "Verified" : "Unverified"} />
          </div>
          <Link to="/app/config" className="btn btn-secondary w-full mt-4 text-[13px]">
            <SlidersHorizontal size={15} /> Lab branding & report config
          </Link>
        </div>

        {/* Editable form */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <h3 className="font-semibold">Personal details</h3>
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. A. Sharma" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className="label">Designation</label>
              <input className="input" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Lab Owner / Pathologist" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-[var(--color-bg)] text-[var(--color-muted)]" value={user?.email ?? ""} readOnly title="Email is managed by your login and can't be changed here." />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button className="btn btn-primary" disabled={save.isPending} onClick={onSave}>
              <Save size={16} /> {save.isPending ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-success)] font-medium">
                <Check size={15} /> Saved
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-[var(--color-muted)]">{icon} {label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}
