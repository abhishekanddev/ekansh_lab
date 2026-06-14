import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailCheck, RefreshCcw, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";

/**
 * Email-verification gate — shown whenever a signed-in user's Firebase account
 * still has `emailVerified === false`. Mirrors the Flutter
 * `EmailVerificationScreen`: polls every 5s and re-routes once the user clicks
 * the link in their inbox.
 */
export function VerifyEmail() {
  const { user, resendVerification, refreshEmailVerified, signOut } = useAuth();
  const nav = useNavigate();
  const [checking, setChecking] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Poll Firebase every 5s — the link opens a separate tab, so we can't rely
  // on onAuthStateChanged firing automatically.
  useEffect(() => {
    if (!user || user.emailVerified) return;
    const t = setInterval(async () => {
      try {
        if (await refreshEmailVerified()) nav("/app/config", { replace: true });
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(t);
  }, [user, refreshEmailVerified, nav]);

  // Resend cooldown — 30s, same as Flutter.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function checkNow() {
    setChecking(true);
    setError(null);
    try {
      const ok = await refreshEmailVerified();
      if (ok) nav("/app/config", { replace: true });
      else setError("Still not verified. Check your inbox (and Spam) for the link.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not check verification.");
    } finally {
      setChecking(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await resendVerification();
      setResent(true);
      setCooldown(30);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not send verification email.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[var(--color-bg)]">
      <div className="card max-w-md w-full p-7 text-center">
        <div className="w-14 h-14 mx-auto grid place-items-center rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-600)] mb-4">
          <MailCheck size={26} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Verify your email</h1>
        <p className="text-[13.5px] text-[var(--color-muted)] mt-2 leading-relaxed">
          We sent a verification link to <span className="font-semibold text-[var(--color-ink)]">{user?.email}</span>.
          Click it to activate your lab account.
        </p>

        {resent && !error && (
          <div className="mt-4 text-[13px] text-[var(--color-success)]">Verification email sent. Please check your inbox.</div>
        )}
        {error && <div className="mt-4 text-[13px] text-[var(--color-danger)]">{error}</div>}

        <div className="mt-6 flex flex-col gap-2">
          <button className="btn btn-primary w-full" onClick={checkNow} disabled={checking}>
            <RefreshCcw size={15} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking…" : "I've verified — continue"}
          </button>
          <button className="btn btn-secondary w-full" onClick={resend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
          </button>
        </div>

        <button className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={() => signOut().then(() => nav("/app/login"))}>
          <LogOut size={13} /> Sign out and use a different email
        </button>

        <p className="mt-5 text-[11px] text-[var(--color-faint)]">We check automatically every few seconds — you can leave this tab open.</p>
      </div>
    </div>
  );
}
