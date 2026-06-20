import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useHospitalId } from "../lib/auth";
import { db } from "../lib/firebase";
import {
  buildSubscription, canPerformWrites, accessLevel, writeBlockReason,
  type OrgSubscription,
} from "../lib/subscription";

/**
 * Live subscription for the signed-in hospital. Mirrors Flutter's
 * `subscriptionStreamProvider`: combines `hospitals/{hid}.subscription_status`
 * with the usage subdoc `hospitals/{hid}/subscription/status`.
 */
export function useSubscription(): { data: OrgSubscription | null; loading: boolean } {
  const hid = useHospitalId();
  const [data, setData] = useState<OrgSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hid || !db) { setData(null); setLoading(false); return; }
    setLoading(true);
    let hospitalData: Record<string, unknown> | null = { subscription_status: "trial" };
    let usage: Record<string, unknown> | null = null;
    let ready = 0;
    const settle = () => { ready++; if (ready >= 2) setLoading(false); setData(buildSubscription(hospitalData, usage)); };

    const unsubHospital = onSnapshot(doc(db, "hospitals", hid), (snap) => {
      hospitalData = (snap.data() as Record<string, unknown> | undefined) ?? { subscription_status: "trial" };
      settle();
    }, () => settle());
    const unsubUsage = onSnapshot(doc(db, "hospitals", hid, "subscription", "status"), (snap) => {
      usage = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
      settle();
    }, () => settle());

    return () => { unsubHospital(); unsubUsage(); };
  }, [hid]);

  return { data, loading };
}

export interface WriteGate {
  /** True while the subscription is loading (fail-open to avoid false blocks). */
  loading: boolean;
  /** Whether write actions are permitted. */
  canWrite: boolean;
  level: "active" | "grace" | "expired";
  /** Message explaining why writes are blocked, or null when allowed. */
  reason: string | null;
}

/**
 * Single hook for write gating across the app. Until the subscription resolves
 * we fail open (`canWrite: true`) so a slow load never blocks a paid lab.
 */
export function useCanWrite(): WriteGate {
  const { data, loading } = useSubscription();
  if (!data) return { loading, canWrite: true, level: "active", reason: null };
  return {
    loading,
    canWrite: canPerformWrites(data),
    level: accessLevel(data),
    reason: writeBlockReason(data),
  };
}
