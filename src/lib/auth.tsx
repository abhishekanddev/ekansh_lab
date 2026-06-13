import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "./firebase";

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string;
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
}

const Ctx = createContext<AuthState | undefined>(undefined);

/** Load users/{uid} to resolve hospital_id, role and display name. */
async function resolveProfile(u: User): Promise<SessionUser> {
  const base: SessionUser = {
    uid: u.uid,
    email: u.email,
    name: u.displayName || u.email?.split("@")[0] || "User",
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
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (auth) await fbSignOut(auth);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, firebaseReady, signIn, signUp, signOut }}>
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
