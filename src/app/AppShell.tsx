import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FilePlus2, FileText, FlaskConical, Users, Receipt,
  SlidersHorizontal, UsersRound, ScrollText, Search, Bell, Building2,
  ChevronDown, LogOut, Beaker,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const NAV = [
  { group: "Workspace" },
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/reports/new", label: "New Report", icon: FilePlus2 },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { group: "Lab" },
  { to: "/app/catalog", label: "Test Catalog", icon: FlaskConical },
  { to: "/app/patients", label: "Patients", icon: Users },
  { to: "/app/invoices", label: "Billing", icon: Receipt },
  { group: "Manage" },
  { to: "/app/config", label: "Report Config", icon: SlidersHorizontal },
  { to: "/app/staff", label: "Staff", icon: UsersRound },
  { to: "/app/activity", label: "Activity Log", icon: ScrollText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const initials = (user?.name || "U").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-[var(--color-border)] flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 h-[60px] px-4 border-b border-[var(--color-border)]">
          <div className="grid place-items-center w-[30px] h-[30px] rounded-lg bg-[var(--color-primary-600)] text-white">
            <Beaker size={18} />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-[15px]">Ekansh Lab</div>
            <div className="text-[11px] text-[var(--color-muted)] truncate max-w-[150px]">
              {user?.hospitalName || "Lab Suite"}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map((item, i) =>
            "group" in item ? (
              <div key={i} className="px-3 pt-3.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-faint)]">
                {item.group}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app/reports"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 font-medium text-sm ${
                    isActive
                      ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
                  }`
                }
              >
                <item.icon size={19} />
                <span className="flex-1">{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="border-t border-[var(--color-border)] px-3 py-2.5 flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] ring-4 ring-green-100" />
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
          <button className="flex items-center gap-2 px-2.5 h-9 border border-[var(--color-border)] rounded-md text-sm hover:bg-[var(--color-bg)]">
            <Building2 size={16} className="text-[var(--color-primary-600)]" />
            <span className="hidden lg:block leading-tight text-left">
              <span className="block font-semibold text-[12.5px]">{user?.hospitalName || "My Lab"}</span>
              <span className="block text-[11px] text-[var(--color-muted)] capitalize">{user?.role || "Lab"}</span>
            </span>
            <ChevronDown size={14} className="text-[var(--color-faint)]" />
          </button>
          <button className="relative w-9 h-9 grid place-items-center border border-[var(--color-border)] rounded-md text-[var(--color-muted)] hover:bg-[var(--color-bg)]">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2 pl-1">
            <span className="w-8 h-8 grid place-items-center rounded-full bg-[var(--color-primary-600)] text-white text-xs font-semibold">{initials}</span>
            <span className="hidden md:block leading-tight">
              <span className="block font-semibold text-[13px]">{user?.name}</span>
              <span className="block text-[11px] text-[var(--color-muted)] capitalize">{user?.role || "staff"}</span>
            </span>
            <button onClick={() => signOut()} title="Sign out" className="ml-1 w-9 h-9 grid place-items-center border border-[var(--color-border)] rounded-md text-[var(--color-muted)] hover:bg-[var(--color-bg)]">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
