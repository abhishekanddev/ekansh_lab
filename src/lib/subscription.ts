/**
 * Subscription model — port of Flutter `OrgSubscription` / `SubscriptionPlan`.
 *
 * Data sources (must stay in sync with the Flutter portal so a single backend
 * powers both clients):
 *   - Status:  `hospitals/{hid}.subscription_status`
 *   - Usage:   `hospitals/{hid}/subscription/status` (snake_case fields)
 */

export type SubscriptionTier =
  | "trial"
  | "trialExpired"
  | "starter"
  | "basic"
  | "basicPlus"
  | "pro"
  | "premium";

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  dailyReportLimit: number;
  dailyAiLimit: number;
  deviceLimit: number;
  /** Max number of additional staff accounts (0 = owner only). */
  staffLimit: number;
  features: string[];
  recommended?: boolean;
}

export const PAID_PLANS: SubscriptionPlan[] = [
  {
    tier: "starter",
    name: "Starter",
    tagline: "Perfect for single-technician labs",
    monthlyPrice: 299,
    yearlyPrice: 2870,
    dailyReportLimit: 10,
    dailyAiLimit: 0,
    deviceLimit: 1,
    staffLimit: 0,
    features: ["10 Reports per day", "Manual entry only", "1 Concurrent user", "Billing & GST"],
  },
  {
    tier: "basic",
    name: "Basic",
    tagline: "Growing labs",
    monthlyPrice: 349,
    yearlyPrice: 3350,
    dailyReportLimit: 20,
    dailyAiLimit: 3,
    deviceLimit: 1,
    staffLimit: 0,
    features: ["20 Reports per day", "3 AI Interpretations / day", "1 Concurrent user", "Billing & GST"],
  },
  {
    tier: "basicPlus",
    name: "Basic+",
    tagline: "Growing labs with higher volume",
    monthlyPrice: 399,
    yearlyPrice: 3830,
    dailyReportLimit: 25,
    dailyAiLimit: 10,
    deviceLimit: 2,
    staffLimit: 1,
    features: ["25 Reports per day", "10 AI Interpretations / day", "2 Concurrent users", "1 Staff account", "Patient Portal", "Billing & GST"],
    recommended: true,
  },
  {
    tier: "pro",
    name: "Pro",
    tagline: "Multi-technician, multi-department",
    monthlyPrice: 499,
    yearlyPrice: 4790,
    dailyReportLimit: 50,
    dailyAiLimit: 20,
    deviceLimit: 2,
    staffLimit: 1,
    features: ["50 Reports per day", "20 AI Interpretations / day", "2 Concurrent users", "1 Staff account", "Patient Portal", "Billing & GST"],
  },
  {
    tier: "premium",
    name: "Premium",
    tagline: "Full-feature diagnostic centre",
    monthlyPrice: 699,
    yearlyPrice: 6710,
    dailyReportLimit: 999_999,
    dailyAiLimit: 50,
    deviceLimit: 2,
    staffLimit: 1,
    features: ["Unlimited Reports", "50 AI Interpretations / day", "1 Staff account", "Doctor Review", "Patient Portal", "Billing & GST"],
  },
];

export const TIER_LABEL: Record<SubscriptionTier, string> = {
  trial: "Free Trial",
  trialExpired: "Trial Expired",
  starter: "Starter",
  basic: "Basic",
  basicPlus: "Basic+",
  pro: "Pro",
  premium: "Premium",
};

export function tierFromFirestore(value: unknown): SubscriptionTier {
  switch (value) {
    case "trialExpired": return "trialExpired";
    case "starter": return "starter";
    case "basic": return "basic";
    case "basicPlus": return "basicPlus";
    case "pro": return "pro";
    case "premium": return "premium";
    case "advance": return "basicPlus"; // legacy
    case "max": return "premium";       // legacy
    default: return "trial";
  }
}

/** Firestore Timestamp | Date | seconds → Date. */
function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === "function") return t.toDate();
  if (typeof t.seconds === "number") return new Date(t.seconds * 1000);
  return null;
}

/** Trial length and post-expiry grace window — must match the backend
 *  (`functions/index.js`: 5-day trial; portal `gracePeriodDays = 7`). */
export const TRIAL_DAYS = 5;
export const GRACE_PERIOD_DAYS = 7;

export interface OrgSubscription {
  tier: SubscriptionTier;
  startDate: Date | null;
  endDate: Date | null;
  /** Trial window from the hospital doc (`trial_start_date` / `trial_end_date`). */
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  reportsCreatedToday: number;
  aiUsedToday: number;
  aiCreditsBalance: number;
  billingCycle: "monthly" | "yearly" | null;
}

export function buildSubscription(
  hospital: Record<string, unknown> | null,
  usage: Record<string, unknown> | null,
): OrgSubscription {
  return {
    tier: tierFromFirestore(hospital?.subscription_status),
    startDate: toDate(usage?.start_date),
    endDate: toDate(usage?.end_date),
    trialStartDate: toDate(hospital?.trial_start_date),
    trialEndDate: toDate(hospital?.trial_end_date),
    reportsCreatedToday: Number(usage?.reports_created_today ?? usage?.photos_used_today ?? 0),
    aiUsedToday: Number(usage?.ai_used_today ?? 0),
    aiCreditsBalance: Number(usage?.ai_credits_balance ?? 0),
    billingCycle:
      usage?.billing_cycle === "monthly" ? "monthly" :
      usage?.billing_cycle === "yearly" ? "yearly" : null,
  };
}

export function planFor(tier: SubscriptionTier): SubscriptionPlan | null {
  return PAID_PLANS.find((p) => p.tier === tier) ?? null;
}

/** Effective trial end: explicit `trial_end_date`, else `trial_start_date + 5d`. */
export function trialEnd(sub: OrgSubscription): Date | null {
  if (sub.tier !== "trial") return null;
  if (sub.trialEndDate) return sub.trialEndDate;
  if (sub.trialStartDate) return new Date(sub.trialStartDate.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return null;
}

export function daysRemaining(sub: OrgSubscription): number | null {
  const end = sub.tier === "trial" ? trialEnd(sub) : sub.endDate;
  if (!end) return null;
  const ms = end.getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function isExpired(sub: OrgSubscription): boolean {
  if (sub.tier === "trialExpired") return true;
  if (sub.tier === "trial") {
    const end = trialEnd(sub);
    return end != null && end.getTime() < Date.now();
  }
  const d = daysRemaining(sub);
  return d != null && d < 0;
}

export function isExpiringSoon(sub: OrgSubscription): boolean {
  const d = daysRemaining(sub);
  return d != null && d >= 0 && d <= 7;
}

/** Whole days since a paid plan lapsed (0 when not yet expired / not paid). */
export function daysSinceExpiry(sub: OrgSubscription): number {
  if (!isPaid(sub) || !sub.endDate) return 0;
  const ms = Date.now() - sub.endDate.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  return days > 0 ? days : 0;
}

/** Paid plan lapsed but still within the 7-day read-only grace window. */
export function isInGracePeriod(sub: OrgSubscription): boolean {
  const since = daysSinceExpiry(sub);
  return since > 0 && since <= GRACE_PERIOD_DAYS;
}

export function isPaid(sub: OrgSubscription): boolean {
  return sub.tier !== "trial" && sub.tier !== "trialExpired";
}

export function dailyReportLimit(sub: OrgSubscription): number {
  if (sub.tier === "premium") return 999_999;
  if (sub.tier === "trial") return 25;
  return planFor(sub.tier)?.dailyReportLimit ?? 0;
}

export function remainingReports(sub: OrgSubscription): number {
  return Math.max(0, dailyReportLimit(sub) - sub.reportsCreatedToday);
}

export function canCreateReport(sub: OrgSubscription): boolean {
  if (isExpired(sub)) return false;
  return remainingReports(sub) > 0;
}

/**
 * Whether the lab may perform any write action (create/edit/delete report,
 * generate invoice, edit prices, manage staff). Blocked once the subscription
 * is expired — which includes the read-only grace window (grace makes
 * `isExpired` true). Single source of truth for write gating across the app.
 */
export function canPerformWrites(sub: OrgSubscription): boolean {
  return !isExpired(sub);
}

/** Coarse state for banner styling / messaging. */
export function accessLevel(sub: OrgSubscription): "active" | "grace" | "expired" {
  if (isInGracePeriod(sub)) return "grace";
  if (isExpired(sub)) return "expired";
  return "active";
}

/** Reason a write is blocked, or null when writes are allowed. */
export function writeBlockReason(sub: OrgSubscription): string | null {
  if (isInGracePeriod(sub)) {
    const left = GRACE_PERIOD_DAYS - daysSinceExpiry(sub);
    return `Your ${TIER_LABEL[sub.tier]} plan has lapsed — you're in a ${left}-day read-only grace period. Renew to continue.`;
  }
  if (isExpired(sub)) {
    return `Your ${TIER_LABEL[sub.tier]} subscription has expired. Please renew to continue.`;
  }
  return null;
}

export function dailyAiLimit(sub: OrgSubscription): number {
  if (sub.tier === "trial") return 3;
  return planFor(sub.tier)?.dailyAiLimit ?? 0;
}

export function remainingAi(sub: OrgSubscription): number {
  return Math.max(0, dailyAiLimit(sub) - sub.aiUsedToday);
}

/** Max additional staff accounts allowed by the current plan (0 = owner only). */
export function staffLimit(sub: OrgSubscription): number {
  if (sub.tier === "trial" || sub.tier === "trialExpired") return 0;
  return planFor(sub.tier)?.staffLimit ?? 0;
}
