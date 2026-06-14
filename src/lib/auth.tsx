import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, firebaseReady } from "./firebase";

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string;
  emailVerified: boolean;
  /** Resolved from users/{uid}.hospital_id — the multi-tenant key. */
  hospitalId: string | null;
  hospitalName: string | null;
  role: string | null;
  demo?: boolean;
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  firebaseReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Resend the verification email to the currently-signed-in user. */
  resendVerification: () => Promise<void>;
  /** Re-fetch the user from Firebase to detect verification (the link
   * opens a new tab, so the SDK state doesn't update on its own). */
  refreshEmailVerified: () => Promise<boolean>;
  /** First-run onboarding: create a hospital and link the current user to it.
   *  Returns the new hospital id. */
  createHospital: (hospitalName: string) => Promise<string>;
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
  };
  if (!db) return base;
  try {
    const snap = await getDoc(doc(db, "users", u.uid));
    if (snap.exists()) {
      const d = snap.data() as Record<string, unknown>;
      return {
        ...base,
        name: (d.name as string) || base.name,
        hospitalId: (d.hospital_id as string) || null,
        hospitalName: (d.hospital_name as string) || null,
        role: (d.role as string) || null,
      };
    }
  } catch {
    /* offline / rules — keep base */
  }
  return base;
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
      setUser(u ? await resolveProfile(u) : null);
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Mirror Flutter: send a verification link immediately on signup.
    try { await sendEmailVerification(cred.user); } catch { /* non-fatal */ }
  };

  const signOut = async () => {
    if (auth) await fbSignOut(auth);
    setUser(null);
  };

  const resendVerification = async () => {
    if (!auth?.currentUser) throw new Error("Not signed in");
    await sendEmailVerification(auth.currentUser);
  };

  const createHospital = async (hospitalName: string): Promise<string> => {
    if (!auth?.currentUser) throw new Error("Not signed in");
    if (!db) throw new Error("Firestore not configured");
    const name = hospitalName.trim();
    if (!name) throw new Error("Hospital name is required");
    const u = auth.currentUser;

    // Create hospitals/{id} with branding name fields the rest of the app reads.
    const hospitalRef = doc(collection(db, "hospitals"));
    await setDoc(hospitalRef, {
      name,
      hospital_name: name,
      createdAt: serverTimestamp(),
      ownerUid: u.uid,
    });

    // Link the signed-in user to the new hospital as admin.
    const displayName = u.displayName || u.email?.split("@")[0] || "User";
    await setDoc(doc(db, "users", u.uid), {
      name: displayName,
      email: u.email ?? null,
      hospital_id: hospitalRef.id,
      hospital_name: name,
      role: "admin",
      createdAt: serverTimestamp(),
    }, { merge: true });

    setUser(await resolveProfile(u));
    return hospitalRef.id;
  };

  const refreshEmailVerified = async (): Promise<boolean> => {
    if (!auth?.currentUser) return false;
    await auth.currentUser.reload();
    const verified = !!auth.currentUser.emailVerified;
    if (verified) setUser(await resolveProfile(auth.currentUser));
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
