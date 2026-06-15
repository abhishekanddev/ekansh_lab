import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions, firebaseReady } from "./firebase";

/** Org details collected at signup, mirroring the Flutter signup form. */
export interface SignUpParams {
  name: string;
  email: string;
  password: string;
  orgName: string;
  /** "lab" | "hospital" — matches OrgType.firestoreValue in Flutter. */
  orgType: string;
  phone: string;
}

/** Persist the org details across the email-verification round-trip so the
 *  account can be auto-activated after the user clicks the link (which may open
 *  a fresh tab / reload). Mirrors Flutter's in-memory pendingOrg* state. */
const PENDING_ORG_KEY = "ekansh_pending_org";
type PendingOrg = { orgName: string; orgType: string; phone: string };
function savePendingOrg(p: PendingOrg) {
  try { localStorage.setItem(PENDING_ORG_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
function loadPendingOrg(): PendingOrg | null {
  try {
    const raw = localStorage.getItem(PENDING_ORG_KEY);
    return raw ? (JSON.parse(raw) as PendingOrg) : null;
  } catch { return null; }
}
function clearPendingOrg() {
  try { localStorage.removeItem(PENDING_ORG_KEY); } catch { /* ignore */ }
}

/** Call the `activateVerifiedAccount` Cloud Function (Admin SDK) to create the
 *  hospital + user docs. Direct client writes are blocked by Firestore rules. */
async function activateAccount(org: PendingOrg): Promise<string> {
  if (!functions) throw new Error("Firebase not configured");
  const activate = httpsCallable<PendingOrg, { success: boolean; hospitalId: string }>(
    functions,
    "activateVerifiedAccount",
  );
  const res = await activate(org);
  return res.data.hospitalId;
}

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string;
  emailVerified: boolean;
  /** Resolved from users/{uid}.hospital_id — the multi-tenant key. */
  hospitalId: string | null;
  hospitalName: string | null;
  role: string | null;
  /** "lab" | "hospital" — read from hospitals/{hid}.org_type. */
  orgType: string | null;
  demo?: boolean;
}

/** Error code thrown when a hospital/doctor account tries to use the lab portal. */
export const ERR_WRONG_PORTAL = "lab/wrong-portal";
const WRONG_PORTAL_MESSAGE =
  "This portal is for Ekansh Lab accounts only. This account is registered as a Doctor / Hospital account, so it can't sign in here. Please use the correct portal for your account type.";

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  firebaseReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
  /** Resend the verification email to the currently-signed-in user. */
  resendVerification: () => Promise<void>;
  /** Re-fetch the user from Firebase to detect verification (the link
   * opens a new tab, so the SDK state doesn't update on its own). */
  refreshEmailVerified: () => Promise<boolean>;
  /** First-run onboarding: activate the verified account via the
   *  `activateVerifiedAccount` Cloud Function (creates the hospital + user docs
   *  with admin privileges — direct client writes are blocked by rules).
   *  Returns the new hospital id. */
  createHospital: (orgName: string, orgType?: string) => Promise<string>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

/** Load users/{uid} to resolve hospital_id, role and display name. */
async function resolveProfile(u: User): Promise<SessionUser> {
  const base: SessionUser = {
    uid: u.uid,
    email: u.email,
    name: u.displayName || u.email?.split("@")[0] || "User",
    emailVerified: u.emailVerified,
    hospitalId: null,
    hospitalName: null,
    role: null,
    orgType: null,
  };
  if (!db) return base;
  try {
    const snap = await getDoc(doc(db, "users", u.uid));
    if (snap.exists()) {
      const d = snap.data() as Record<string, unknown>;
      const hospitalId = (d.hospital_id as string) || null;
      let orgType: string | null = (d.org_type as string) || null;
      // org_type lives on the hospital doc — fetch it so we can gate non-lab orgs.
      if (hospitalId && !orgType) {
        try {
          const hsnap = await getDoc(doc(db, "hospitals", hospitalId));
          if (hsnap.exists()) orgType = ((hsnap.data() as Record<string, unknown>).org_type as string) || null;
        } catch { /* ignore */ }
      }
      return {
        ...base,
        name: (d.name as string) || base.name,
        hospitalId,
        hospitalName: (d.hospital_name as string) || null,
        role: (d.role as string) || null,
        orgType,
      };
    }
  } catch {
    /* offline / rules — keep base */
  }
  return base;
}

/** Throw if the signed-in user belongs to a non-lab org. Signs them out first. */
async function enforceLabOrg(profile: SessionUser): Promise<void> {
  // Only enforce once a hospital is linked. Pending/unverified accounts (no
  // hospitalId yet) fall through to the existing verify-email / onboarding flow.
  if (!profile.hospitalId || !profile.orgType) return;
  if (profile.orgType !== "lab") {
    if (auth) await fbSignOut(auth);
    const err = new Error(WRONG_PORTAL_MESSAGE) as Error & { code?: string };
    err.code = ERR_WRONG_PORTAL;
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (u) => {
      if (!u) { setUser(null); setLoading(false); return; }
      const profile = await resolveProfile(u);
      // Doctor/hospital accounts must not land in the lab UI — sign them out.
      if (profile.hospitalId && profile.orgType && profile.orgType !== "lab") {
        try { await fbSignOut(auth!); } catch { /* ignore */ }
        setUser(null);
      } else {
        setUser(profile);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Resolve before letting onAuthStateChanged settle, so the wrong-portal
    // error surfaces synchronously inside the Login submit handler.
    const profile = await resolveProfile(cred.user);
    await enforceLabOrg(profile);
  };

  const signUp = async (params: SignUpParams) => {
    if (!auth) throw new Error("Firebase not configured");
    const { name, email, password, orgName, orgType, phone } = params;
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

    // Set the display name (non-critical).
    try { await updateProfile(cred.user, { displayName: name.trim() }); } catch { /* non-fatal */ }

    // Mirror Flutter: send a verification link immediately on signup.
    try { await sendEmailVerification(cred.user); } catch { /* non-fatal */ }

    // Mirror Flutter: attempt a pending users/{uid} doc. Firestore rules block
    // client writes to /users, so this is expected to fail — the real doc is
    // created by activateVerifiedAccount after verification. Harmless either way.
    if (db) {
      try {
        await setDoc(doc(db, "users", cred.user.uid), {
          name: name.trim(),
          email: email.trim(),
          role: "pending",
          hospital_id: "",
          org_name: orgName.trim(),
          org_type: orgType,
          phone: phone.trim(),
          created_at: serverTimestamp(),
          email_verified: false,
          status: "pending_verification",
        });
      } catch { /* expected: blocked by rules */ }
    }

    // Persist org details so the account auto-activates after verification.
    savePendingOrg({ orgName: orgName.trim(), orgType, phone: phone.trim() });
  };

  const signOut = async () => {
    if (auth) await fbSignOut(auth);
    setUser(null);
  };

  const resendVerification = async () => {
    if (!auth?.currentUser) throw new Error("Not signed in");
    await sendEmailVerification(auth.currentUser);
  };

  const createHospital = async (orgName: string, orgType = "lab"): Promise<string> => {
    if (!auth?.currentUser) throw new Error("Not signed in");
    const name = orgName.trim();
    if (!name) throw new Error("Lab name is required");
    const u = auth.currentUser;

    const hospitalId = await activateAccount({ orgName: name, orgType, phone: "" });
    clearPendingOrg();

    // Force an ID-token refresh so the freshly-written user doc is readable
    // (rules require is_active === true, just set by the function).
    await u.getIdToken(true);
    setUser(await resolveProfile(u));
    return hospitalId;
  };

  const refreshEmailVerified = async (): Promise<boolean> => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    const u = auth.currentUser;
    const verified = !!u.emailVerified;
    if (!verified) return false;

    // Mirror Flutter checkEmailVerified: on first verification, auto-activate
    // using the org details captured at signup. The Cloud Function is idempotent
    // (returns alreadyActive for repeat calls), so this is safe to retry.
    const pending = loadPendingOrg();
    if (pending) {
      try {
        await activateAccount(pending);
        clearPendingOrg();
        await u.getIdToken(true);
      } catch {
        // Activation failed (e.g. function/network) — fall through; the user can
        // still complete setup manually on the onboarding screen.
      }
    }

    setUser(await resolveProfile(u));
    return verified;
  };

  return (
    <Ctx.Provider value={{ user, loading, firebaseReady, signIn, signUp, signOut, resendVerification, refreshEmailVerified, createHospital }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/** Convenience: throw-safe hospital id for queries. */
export function useHospitalId(): string | null {
  return useAuth().user?.hospitalId ?? null;
}
