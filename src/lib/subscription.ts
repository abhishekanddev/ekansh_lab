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
    features: ["25 Reports per day", "10 AI Interpretations / day", "2 Concurrent users", "Patient Portal", "Billing & GST"],
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
    features: ["50 Reports per day", "20 AI Interpretations / day", "2 Concurrent users", "Patient Portal", "Billing & GST"],
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
    features: ["Unlimited Reports", "50 AI Interpretations / day", "Doctor Review", "Patient Portal", "Billing & GST"],
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

export interface OrgSubscription {
  tier: SubscriptionTier;
  startDate: Date | null;
  endDate: Date | null;
  reportsCreatedToday: number;
  aiUsedToday: number;
  aiCreditsBalance: number;
  billingCycle: "monthly" | "yearly" | null;
}

export function buildSubscription(
  hospitalStatus: unknown,
  usage: Record<string, unknown> | null,
): OrgSubscription {
  return {
    tier: tierFromFirestore(hospitalStatus),
    startDate: toDate(usage?.start_date),
    endDate: toDate(usage?.end_date),
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

export function daysRemaining(sub: OrgSubscription): number | null {
  if (!sub.endDate) return null;
  const ms = sub.endDate.getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function isExpired(sub: OrgSubscription): boolean {
  if (sub.tier === "trialExpired") return true;
  const d = daysRemaining(sub);
  return d != null && d < 0;
}

export function isExpiringSoon(sub: OrgSubscription): boolean {
  const d = daysRemaining(sub);
  return d != null && d >= 0 && d <= 7;
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

export function dailyAiLimit(sub: OrgSubscription): number {
  if (sub.tier === "trial") return 3;
  return planFor(sub.tier)?.dailyAiLimit ?? 0;
}

export function remainingAi(sub: OrgSubscription): number {
  return Math.max(0, dailyAiLimit(sub) - sub.aiUsedToday);
}
