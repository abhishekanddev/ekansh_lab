import { useState } from "react";
import { UserPlus, MoreVertical, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { useStaff, useCreateStaffAccount, useToggleStaffStatus } from "../hooks/useLabData";
import { useSubscription } from "../hooks/useSubscription";
import { useAuth } from "../lib/auth";
import { staffLimit } from "../lib/subscription";

export function Staff() {
  const { user } = useAuth();
  const staff = useStaff();
  const { data: sub } = useSubscription();
  const createStaff = useCreateStaffAccount();
  const toggleStatus = useToggleStaffStatus();

  const [showModal, setShowModal] = useState(false);
  const [openMenu, setOpenMenu] = useState<{ id: string; top: number; right: number } | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<{ id: string; name: string; active: boolean } | null>(null);

  const isOwner = user?.role === "hospital";
  const limit = sub ? staffLimit(sub) : 0;
  // Staff members excluding the owner
  const staffOnly = (staff.data ?? []).filter((s) => s.role !== "hospital");
  const atLimit = staffOnly.length >= limit;
  const canAddStaff = isOwner && limit > 0 && !atLimit;
  const needsUpgrade = isOwner && limit === 0;

  return (
    <div>
      <PageHeader
        breadcrumb="Home / Staff"
        title="Staff"
        description="Users with access to this lab."
        actions={
          isOwner && (
            <button
              onClick={() => (needsUpgrade ? null : setShowModal(true))}
              disabled={!canAddStaff && !needsUpgrade}
              title={atLimit && !needsUpgrade ? `Staff limit reached (${limit})` : undefined}
              className={`btn btn-primary flex items-center gap-1.5 ${(!canAddStaff && !needsUpgrade) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <UserPlus size={15} />
              Add Staff
            </button>
          )
        }
      />

      {/* Upgrade prompt when plan has no staff slot */}
      {needsUpgrade && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Crown size={16} className="shrink-0 text-amber-500" />
          <span>Your current plan doesn't include staff accounts. <Link to="/app/subscription" className="font-semibold underline">Upgrade to Basic+ or higher</Link> to add a staff member.</span>
        </div>
      )}

      {/* At-limit notice */}
      {isOwner && !needsUpgrade && atLimit && staffOnly.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Crown size={16} className="shrink-0 text-blue-500" />
          <span>You've used all {limit} staff slot{limit !== 1 ? "s" : ""} on your plan. <Link to="/app/subscription" className="font-semibold underline">Upgrade</Link> to add more.</span>
        </div>
      )}

      <div className="card overflow-x-auto">
        {staff.isLoading ? (
          <Spinner />
        ) : (staff.data?.length ?? 0) === 0 ? (
          <div className="p-8">
            <EmptyState title="No staff found" hint={isOwner ? "Add a staff member to get started." : "Staff accounts are managed by your lab owner."} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                <th className="font-semibold px-4 py-2.5">Name</th>
                <th className="font-semibold px-4 py-2.5">Email</th>
                <th className="font-semibold px-4 py-2.5">Role</th>
                <th className="font-semibold px-4 py-2.5">Phone</th>
                <th className="font-semibold px-4 py-2.5">Status</th>
                {isOwner && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {staff.data!.map((s) => (
                <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                  <td className="px-4 py-3 font-medium">{s.name || "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{s.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-[var(--color-primary-50)] text-[var(--color-primary-700)] capitalize">
                      {s.role === "hospital" ? "Owner" : s.role || "staff"}
                    </span>
                  </td>
                  <td className="px-4 py-3 num text-[var(--color-muted)]">{s.phone || "—"}</td>
                  <td className="px-4 py-3">
                    {s.role === "hospital" ? (
                      <span className="badge bg-green-50 text-green-700">Active</span>
                    ) : (
                      <span className={`badge ${s.is_active !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {s.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3 text-right">
                      {s.role !== "hospital" && (
                        <button
                          onClick={(e) => {
                            if (openMenu?.id === s.id) { setOpenMenu(null); return; }
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setOpenMenu({ id: s.id, top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          }}
                          className="p-1 rounded hover:bg-[var(--color-border)] text-[var(--color-muted)]"
                        >
                          <MoreVertical size={15} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <AddStaffModal
          onClose={() => setShowModal(false)}
          onCreate={async (data) => {
            await createStaff.mutateAsync(data);
            setShowModal(false);
          }}
          loading={createStaff.isPending}
          error={createStaff.error?.message}
        />
      )}

      {/* Fixed-position three-dot dropdown (escapes overflow-hidden) */}
      {openMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
          <div
            className="fixed z-50 w-36 rounded-lg border border-[var(--color-border)] bg-white shadow-lg py-1 text-sm"
            style={{ top: openMenu.top, right: openMenu.right }}
          >
            {(() => {
              const member = staff.data?.find((s) => s.id === openMenu.id);
              if (!member) return null;
              return (
                <button
                  onClick={() => {
                    setConfirmToggle({ id: member.id, name: member.name || "Staff", active: member.is_active !== false });
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[var(--color-bg)]"
                >
                  {member.is_active !== false ? "Deactivate" : "Activate"}
                </button>
              );
            })()}
          </div>
        </>
      )}

      {/* Confirm Toggle Dialog */}
      {confirmToggle && (
        <ConfirmDialog
          title={confirmToggle.active ? "Deactivate Staff?" : "Activate Staff?"}
          message={
            confirmToggle.active
              ? `This will prevent ${confirmToggle.name} from logging in.`
              : `This will restore ${confirmToggle.name}'s access.`
          }
          confirmLabel={confirmToggle.active ? "Deactivate" : "Activate"}
          danger={confirmToggle.active}
          loading={toggleStatus.isPending}
          onConfirm={async () => {
            await toggleStatus.mutateAsync({ staffId: confirmToggle.id, newStatus: !confirmToggle.active });
            setConfirmToggle(null);
          }}
          onCancel={() => setConfirmToggle(null)}
        />
      )}
    </div>
  );
}

/* ── Add Staff Modal ──────────────────────────────────────────────────────── */
function AddStaffModal({
  onClose,
  onCreate,
  loading,
  error,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; email: string; password: string }) => Promise<void>;
  loading: boolean;
  error?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!name.trim()) { setLocalError("Name is required"); return; }
    if (!email.trim() || !email.includes("@")) { setLocalError("Valid email is required"); return; }
    if (password.length < 6) { setLocalError("Password must be at least 6 characters"); return; }
    try {
      await onCreate({ name: name.trim(), email: email.trim(), password });
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-1">Add Staff Member</h2>
        <p className="text-sm text-[var(--color-muted)] mb-5">Create a login for a new staff member.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--color-muted)] uppercase tracking-wide">Full Name</label>
            <input
              className="input w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Riya Sharma"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--color-muted)] uppercase tracking-wide">Email Address</label>
            <input
              className="input w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@yourlab.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-[var(--color-muted)] uppercase tracking-wide">Temporary Password</label>
            <div className="relative">
              <input
                className="input w-full pr-12"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-muted)] font-medium"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {(localError || error) && (
            <p className="text-sm text-red-600">{localError || error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Confirm Dialog ───────────────────────────────────────────────────────── */
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        <p className="text-sm text-[var(--color-muted)] mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-ghost flex-1" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`btn flex-1 ${danger ? "bg-red-600 text-white hover:bg-red-700" : "btn-primary"}`}
          >
            {loading ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
