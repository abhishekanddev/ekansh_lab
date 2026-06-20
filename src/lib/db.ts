import {
  collection,
  doc,
  addDoc,
  serverTimestamp,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./firebase";

/** Throws if Firestore is not configured — call sites assume a live project. */
export function requireDb() {
  if (!db) throw new Error("Firestore not configured");
  return db;
}

/** Throws a clear error when the signed-in user has no hospital assigned,
 *  instead of letting Firestore crash on a null path segment. */
function requireHid(hid: string | null | undefined): string {
  if (!hid) {
    throw new Error(
      "No hospital is linked to your account. Ask an admin to set hospital_id on your user profile."
    );
  }
  return hid;
}

/** hospitals/{hid} doc. */
export function hospitalRef(hid: string | null | undefined): DocumentReference {
  return doc(requireDb(), "hospitals", requireHid(hid));
}

/** A sub-collection under hospitals/{hid}. */
export function hospitalCol(hid: string | null | undefined, name: string): CollectionReference {
  return collection(requireDb(), "hospitals", requireHid(hid), name);
}

export function hospitalDoc(hid: string | null | undefined, name: string, id: string): DocumentReference {
  return doc(requireDb(), "hospitals", requireHid(hid), name, id);
}

/** Fields recorded for a single audit-trail entry. */
export interface ActivityEntry {
  action: string;
  target_name?: string;
  performed_by?: string;
  performed_by_uid?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append an entry to hospitals/{hid}/lab_activity_logs. Mirrors the Flutter
 * app's audit trail so the web client's actions (report create/delete, price
 * changes) show up in the shared Activity Log. Best-effort: logging failures
 * must never block the underlying action, so callers can ignore rejections.
 */
export async function logActivity(hid: string | null | undefined, entry: ActivityEntry): Promise<void> {
  await addDoc(hospitalCol(hid, COL.activity), {
    ...entry,
    timestamp: serverTimestamp(),
  });
}

export const COL = {
  reports: "lab_reports",
  drafts: "lab_drafts",
  catalog: "test_catalog",
  invoices: "invoices",
  counters: "counters",
  patients: "lab_patients",
  referrers: "referrers",
  activity: "lab_activity_logs",
  settings: "settings",
} as const;
