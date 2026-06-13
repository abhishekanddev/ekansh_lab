import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Beaker, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth";

type Mode = "signin" | "signup";

export function Login() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Where to land once the auth state actually resolves (avoids navigating
  // before onAuthStateChanged sets the user, which bounced back to login).
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (user && pending) navigate(pending, { replace: true });
  }, [user, pending, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        // New labs start on Report Settings to configure branding.
        setPending("/app/config");
      } else {
        await signIn(email, password);
        setPending("/app/dashboard");
      }
      // Keep busy=true; the effect navigates once the user resolves.
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "auth/email-already-in-use") setError("This email is already registered. Please sign in.");
      else if (code === "auth/invalid-credential" || code === "auth/wrong-password") setError("Invalid email or password.");
      else if (code === "auth/user-not-found") setError("No account found.");
      else setError(err?.message || "Authentication failed");
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col p-14 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(150deg,#0f47a1 0%,#1559c9 52%,#1f6feb 100%)" }}>
        <Link to="/" className="flex items-center gap-3 text-white no-underline">
          <div className="grid place-items-center w-9 h-9 rounded-lg bg-white/15"><Beaker size={22} /></div>
          <span className="text-xl font-bold">Ekansh Lab Suite</span>
        </Link>
        <div className="mt-auto">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">Reports, billing &<br />AI interpretation</h1>
          <p className="mt-4 text-white/80 max-w-md leading-relaxed">
            The operating system for modern diagnostic labs. Branded PDFs in seconds with
            auto-populated reference ranges for 2,000+ parameters.
          </p>
          <div className="flex gap-3 mt-7">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-[12.5px] font-semibold">
              <ShieldCheck size={15} /> NABL-ready audit trail
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-[12.5px] font-semibold">
              <Lock size={15} /> AES-256 encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="grid place-items-center p-10 bg-white">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold tracking-tight">{mode === "signin" ? "Sign in" : "Create account"}</h2>
          <p className="text-[var(--color-muted)] text-sm mt-1.5 mb-6">
            {mode === "signin" ? "Welcome back. Please sign in to continue." : "Set up a new lab account to get started."}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" autoComplete="username" required
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lab.org" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {mode === "signup" && (
              <div>
                <label className="label">Confirm Password</label>
                <input className="input" type="password" autoComplete="new-password" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
              </div>
            )}
            {error && <div className="text-[13px] text-[var(--color-danger)]">{error}</div>}
            <button className="btn btn-primary w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="text-center mt-4">
            <button onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setError(null); }}
              className="text-sm text-[var(--color-primary-600)] hover:underline">
              {mode === "signin" ? "New lab? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
