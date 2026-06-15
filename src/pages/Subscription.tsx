import { useMemo, useState } from "react";
import { CheckCircle2, Sparkles, Clock, AlertTriangle, Crown, Loader2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner } from "../components/ui";
import { useSubscription } from "../hooks/useSubscription";
import { useAuth } from "../lib/auth";
import { upgradePlan } from "../lib/razorpay";
import {
  PAID_PLANS, TIER_LABEL, planFor, daysRemaining, isExpired, isExpiringSoon, isPaid,
  dailyReportLimit, remainingReports, dailyAiLimit, remainingAi, type SubscriptionTier,
} from "../lib/subscription";

export function Subscription() {
  const { data: sub, loading } = useSubscription();
  const { user } = useAuth();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [payingTier, setPayingTier] = useState<SubscriptionTier | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  async function onUpgrade(tier: SubscriptionTier) {
    setPayError(null);
    setPayingTier(tier);
    try {
      await upgradePlan({
        planTier: tier,
        billingCycle: cycle,
        prefill: { name: user?.name ?? "", email: user?.email ?? "", contact: "" },
      });
      // Subscription doc updates via the live snapshot — no manual refresh needed.
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== "Payment cancelled.") setPayError(msg);
    } finally {
      setPayingTier(null);
    }
  }

  const summary = useMemo(() => {
    if (!sub) return null;
    return {
      label: TIER_LABEL[sub.tier],
      expired: isExpired(sub),
      soon: isExpiringSoon(sub),
      days: daysRemaining(sub),
      reportLimit: dailyReportLimit(sub),
      reportsLeft: remainingReports(sub),
      aiLimit: dailyAiLimit(sub),
      aiLeft: remainingAi(sub),
      currentPlan: planFor(sub.tier),
      paid: isPaid(sub),
    };
  }, [sub]);

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader
        breadcrumb="Home / Subscription"
        title="Subscription"
        description="Your plan, daily quotas, and available upgrades."
      />

      {/* Current plan banner */}
      {sub && summary && (
        <div
          className={`rounded-xl p-6 mb-6 text-white relative overflow-hidden ${
            summary.expired
              ? "bg-gradient-to-br from-[#b91c1c] to-[#7f1d1d]"
              : summary.soon
                ? "bg-gradient-to-br from-[#ea580c] to-[#c2410c]"
                : "bg-gradient-to-br from-[var(--color-primary-700,#0f47a1)] to-[var(--color-primary-600,#1559c9)]"
          }`}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-white/80 text-[12px] uppercase tracking-wider font-semibold">
                <Crown size={14} /> Current Plan
              </div>
              <div className="text-3xl font-bold mt-1.5">{summary.label}</div>
              {summary.paid && summary.days != null && !summary.expired && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[13px] font-semibold">
                  <Clock size={13} /> {summary.days} {summary.days === 1 ? "day" : "days"} left
                </div>
              )}
              {summary.expired && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-[13px] font-semibold">
                  <AlertTriangle size={13} /> Expired — please renew to continue
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 min-w-[260px]">
              <Stat label="Reports today" used={sub.reportsCreatedToday} limit={summary.reportLimit} left={summary.reportsLeft} />
              <Stat label="AI today" used={sub.aiUsedToday} limit={summary.aiLimit} left={summary.aiLeft} />
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-semibold text-lg">Available plans</h3>
        <div className="inline-flex rounded-md border border-[var(--color-border)] p-0.5 text-[13px] bg-white">
          <button
            onClick={() => setCycle("monthly")}
            className={`px-3 py-1.5 rounded ${cycle === "monthly" ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold" : "text-[var(--color-muted)]"}`}
          >Monthly</button>
          <button
            onClick={() => setCycle("yearly")}
            className={`px-3 py-1.5 rounded ${cycle === "yearly" ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] font-semibold" : "text-[var(--color-muted)]"}`}
          >Yearly <span className="text-[10px] ml-1 text-[var(--color-success)]">save ~18%</span></button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {PAID_PLANS.map((p) => {
          const current = sub?.tier === p.tier;
          const price = cycle === "monthly" ? p.monthlyPrice : Math.round(p.yearlyPrice / 12);
          return (
            <div
              key={p.tier}
              className={`card p-5 flex flex-col ${p.recommended ? "border-[var(--color-primary-300)] ring-1 ring-[var(--color-primary-300)]" : ""}`}
            >
              {p.recommended && (
                <span className="self-start mb-2 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider bg-[var(--color-primary-50)] text-[var(--color-primary-700)] rounded-full px-2 py-0.5">
                  <Sparkles size={11} /> Recommended
                </span>
              )}
              <div className="font-bold text-base">{p.name}</div>
              <div className="text-[12px] text-[var(--color-muted)] mb-3">{p.tagline}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold">₹{price.toLocaleString("en-IN")}</span>
                <span className="text-[12px] text-[var(--color-faint)]">/mo</span>
              </div>
              {cycle === "yearly" && (
                <div className="text-[11px] text-[var(--color-muted)] mb-3">billed ₹{p.yearlyPrice.toLocaleString("en-IN")} yearly</div>
              )}
              <ul className="space-y-1.5 mb-4 mt-2 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px] text-[var(--color-muted)]">
                    <CheckCircle2 size={14} className="text-[var(--color-success)] shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={current || payingTier !== null}
                onClick={() => onUpgrade(p.tier)}
                className={`btn ${current ? "btn-secondary" : "btn-primary"} w-full`}
                title={current ? "Your current plan" : `Pay securely via Razorpay`}
              >
                {payingTier === p.tier ? (
                  <><Loader2 size={15} className="animate-spin" /> Processing…</>
                ) : current ? "Current plan" : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>

      {payError && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-[var(--color-danger)]">
          {payError}
        </div>
      )}

      <p className="text-[12px] text-[var(--color-muted)] mt-6">
        Payments are processed securely by Razorpay. Plans activate immediately after a successful payment.
      </p>
    </div>
  );
}

function Stat({ label, used, limit, left }: { label: string; used: number; limit: number; left: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const displayLimit = limit >= 999_999 ? "∞" : limit;
  return (
    <div className="bg-white/10 rounded-lg p-3">
      <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">{label}</div>
      <div className="font-bold text-lg leading-tight mt-0.5">{used} / {displayLimit}</div>
      <div className="text-[11px] text-white/80">{limit >= 999_999 ? "unlimited" : `${left} left`}</div>
      <div className="h-1 mt-1.5 bg-white/15 rounded-full overflow-hidden">
        <div className="h-full bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
