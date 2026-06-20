import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FilePlus2, FileText, FlaskConical, Users, Receipt,
  SlidersHorizontal, UsersRound, ScrollText, Search, Bell,
  LogOut, Beaker, Crown, AlertTriangle, Clock, UserCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useSubscription, useCanWrite } from "../hooks/useSubscription";
import { TIER_LABEL, daysRemaining, daysSinceExpiry, isExpired, isExpiringSoon, isInGracePeriod, GRACE_PERIOD_DAYS } from "../lib/subscription";

const NAV = [
  { group: "Workspace" },
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/reports/new", label: "New Report", icon: FilePlus2, write: true },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { group: "Lab" },
  { to: "/app/catalog", label: "Test Catalog", icon: FlaskConical },
  { to: "/app/patients", label: "Patients", icon: Users },
  { to: "/app/invoices", label: "Billing", icon: Receipt },
  { group: "Manage" },
  { to: "/app/config", label: "Report Config", icon: SlidersHorizontal },
  { to: "/app/staff", label: "Staff", icon: UsersRound },
  { to: "/app/activity", label: "Activity Log", icon: ScrollText },
  { to: "/app/subscription", label: "Subscription", icon: Crown },
  { to: "/app/profile", label: "My Account", icon: UserCircle },
] as const;

/** Friendly label for a user's role — never surfaces the raw "hospital" owner role. */
function roleLabel(role?: string | null): string {
  switch ((role || "").toLowerCase()) {
    case "hospital":
    case "owner":
    case "admin": return "Lab Admin";
    case "staff": return "Staff";
    default: return "Lab";
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { data: sub } = useSubscription();
  const { canWrite, level, reason } = useCanWrite();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const initials = (user?.name || "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#0f172a] flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 h-[60px] px-4 border-b border-white/10">
          <div className="grid place-items-center w-[30px] h-[30px] rounded-lg bg-[var(--color-primary-600)] text-white">
            <Beaker size={18} />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-[15px] text-white">Ekansh Lab</div>
            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
              {user?.hospitalName || "Lab Suite"}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map((item, i) =>
            "group" in item ? (
              <div key={i} className="px-3 pt-3.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {item.group}
              </div>
            ) : "write" in item && item.write && !canWrite ? (
              // Write-gated nav item — shown disabled while expired/in grace.
              <span
                key={item.to}
                title={reason ?? undefined}
                className="flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 font-medium text-[13.5px] text-slate-600 cursor-not-allowed opacity-50"
              >
                <item.icon size={17} />
                <span className="flex-1">{item.label}</span>
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app/reports"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 font-medium text-[13.5px] ${
                    isActive
                      ? "bg-[var(--color-primary-600)] text-white"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <item.icon size={17} />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-2.5 flex items-center gap-2 text-[12px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] ring-4 ring-green-900/40" />
          Connected · Live
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[60px] bg-white border-b border-[var(--color-border)] flex items-center gap-4 px-5 sticky top-0 z-20">
          <div className="relative flex-1 max-w-[420px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]" />
            <input
              className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none focus:bg-white focus:border-[var(--color-primary-300)]"
              placeholder="Search patient, report, phone…"
            />
          </div>
          <div className="flex-1" />
          <SubscriptionBadge sub={sub} />
          <button className="relative w-9 h-9 grid place-items-center border border-[var(--color-border)] rounded-md text-[var(--color-muted)] hover:bg-[var(--color-bg)]">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2 pl-1 border-l border-[var(--color-border)] ml-1">
            <Link to="/app/profile" title="My account" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg)]">
              <span className="w-8 h-8 grid place-items-center rounded-full bg-[var(--color-primary-600)] text-white text-xs font-semibold shrink-0">{initials}</span>
              <span className="hidden md:block leading-tight">
                <span className="block font-semibold text-[13px]">{user?.name}</span>
                <span className="block text-[11px] text-[var(--color-muted)]">{roleLabel(user?.role)}</span>
              </span>
            </Link>
            <button onClick={() => setConfirmLogout(true)} title="Sign out" className="w-8 h-8 grid place-items-center rounded-md text-[var(--color-faint)] hover:text-[var(--color-danger)] hover:bg-red-50">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {confirmLogout && (
          <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4" onClick={() => setConfirmLogout(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 grid place-items-center rounded-full bg-[var(--color-danger-50,#fef2f2)] text-[var(--color-danger)]"><LogOut size={18} /></span>
                <h3 className="font-semibold text-[16px]">Sign out?</h3>
              </div>
              <p className="text-[13px] text-[var(--color-muted)] mb-4">You'll need to sign in again to access your lab.</p>
              <div className="flex justify-end gap-2">
                <button className="btn btn-secondary" onClick={() => setConfirmLogout(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => { setConfirmLogout(false); signOut(); }}>Sign out</button>
              </div>
            </div>
          </div>
        )}

        {level !== "active" && reason && (
          <div className={`flex items-center gap-3 px-5 py-2.5 text-[13px] border-b ${
            level === "expired"
              ? "bg-red-50 border-red-200 text-[var(--color-danger)]"
              : "bg-orange-50 border-orange-200 text-orange-800"
          }`}>
            <AlertTriangle size={16} className="shrink-0" />
            <span className="flex-1">{reason}</span>
            <Link to="/app/subscription" className="font-semibold underline shrink-0">Renew now</Link>
          </div>
        )}

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

/** Compact "X days left" / "Trial" / "Expired" badge linking to the Subscription page. */
function SubscriptionBadge({ sub }: { sub: ReturnType<typeof useSubscription>["data"] }) {
  if (!sub) return null;
  const days = daysRemaining(sub);
  const expired = isExpired(sub);
  const soon = isExpiringSoon(sub);
  const grace = isInGracePeriod(sub);

  let label: string;
  let Icon = Clock;
  let cls = "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-300)]";
  if (grace) {
    // Paid plan lapsed but still within the read-only grace window.
    const left = GRACE_PERIOD_DAYS - daysSinceExpiry(sub);
    label = `Grace: ${left} ${left === 1 ? "day" : "days"}`;
    Icon = AlertTriangle;
    cls = "bg-orange-50 text-orange-700 border-orange-200";
  } else if (expired) {
    label = "Expired";
    Icon = AlertTriangle;
    cls = "bg-red-50 text-[var(--color-danger)] border-red-200";
  } else if (days != null) {
    // Countdown for both paid plans and active trials.
    label = sub.tier === "trial"
      ? `Trial: ${days} ${days === 1 ? "day" : "days"} left`
      : `${days} ${days === 1 ? "day" : "days"} left`;
    if (soon) cls = "bg-orange-50 text-orange-700 border-orange-200";
  } else {
    label = TIER_LABEL[sub.tier];
  }

  return (
    <Link
      to="/app/subscription"
      title="Manage subscription"
      className={`hidden md:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border text-[12.5px] font-semibold ${cls}`}
    >
      <Icon size={14} />
      <span>{label}</span>
    </Link>
  );
}
