import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";

/**
 * First-run onboarding — shown when a verified user has no hospital linked
 * (users/{uid}.hospital_id is missing). Creates a hospital and links the user
 * as admin, then routes into the app. Without this, every hospital-scoped
 * write crashes because the Firestore path segment is null.
 */
export function Onboarding() {
  const { user, createHospital, signOut } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createHospital(name);
      nav("/app/config", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create your lab.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[var(--color-bg)]">
      <div className="card max-w-md w-full p-7">
        <div className="w-14 h-14 mx-auto grid place-items-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-600)] mb-4">
          <Building2 size={26} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-center">Set up your lab</h1>
        <p className="text-[13.5px] text-[var(--color-muted)] mt-2 leading-relaxed text-center">
          Welcome, <span className="font-semibold text-[var(--color-ink)]">{user?.email}</span>.
          Name your lab to finish setting up your account. You can change branding details later in Config.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <label className="text-[13px] font-medium text-[var(--color-ink)]">
            Lab / Hospital name
            <input
              className="input mt-1.5 w-full"
              placeholder="e.g. Chaurasia Diagnostics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>

          {error && <div className="text-[13px] text-[var(--color-danger)]">{error}</div>}

          <button className="btn btn-primary w-full" type="submit" disabled={busy || !name.trim()}>
            {busy ? "Creating…" : "Continue"}
            {!busy && <ArrowRight size={15} />}
          </button>
        </form>

        <button
          className="mt-5 mx-auto flex items-center gap-1.5 text-[12.5px] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          onClick={() => signOut().then(() => nav("/app/login"))}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );
}
