import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "./firebase";

/** Throws if Firestore is not configured — call sites assume a live project. */
export function requireDb() {
  if (!db) throw new Error("Firestore not configured");
  return db;
}

/** hospitals/{hid} doc. */
export function hospitalRef(hid: string): DocumentReference {
  return doc(requireDb(), "hospitals", hid);
}

/** A sub-collection under hospitals/{hid}. */
export function hospitalCol(hid: string, name: string): CollectionReference {
  return collection(requireDb(), "hospitals", hid, name);
}

export function hospitalDoc(hid: string, name: string, id: string): DocumentReference {
  return doc(requireDb(), "hospitals", hid, name, id);
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
