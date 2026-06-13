import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc as fbDoc,
  query,
  orderBy,
  limit as fbLimit,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { useHospitalId } from "../lib/auth";
import { collection } from "firebase/firestore";
import { hospitalCol, hospitalDoc, hospitalRef, COL, requireDb } from "../lib/db";
import type {
  LabReport,
  LabPatient,
  Referrer,
  TestCatalogItem,
  InvoiceModel,
  HospitalConfig,
  LabActivityLog,
} from "../lib/types";

function rows<T>(snap: Awaited<ReturnType<typeof getDocs>>): T[] {
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[];
}

/* ── Hospital config (branding) ─────────────────────────────────────────── */
export function useHospitalConfig() {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["hospitalConfig", hid],
    enabled: !!hid,
    queryFn: async () => {
      const snap = await getDoc(hospitalRef(hid!));
      return (snap.exists() ? snap.data() : {}) as HospitalConfig;
    },
  });
}

export function useSaveHospitalConfig() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<HospitalConfig>) => {
      await setDoc(hospitalRef(hid!), patch, { merge: true });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hospitalConfig", hid] }),
  });
}

/* ── Reports ────────────────────────────────────────────────────────────── */
export function useRecentReports(max = 50) {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["reports", hid, max],
    enabled: !!hid,
    queryFn: async () => {
      const q = query(hospitalCol(hid!, COL.reports), orderBy("createdAt", "desc"), fbLimit(max));
      return rows<LabReport>(await getDocs(q));
    },
  });
}

export function useReport(id?: string) {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["report", hid, id],
    enabled: !!hid && !!id,
    queryFn: async () => {
      const snap = await getDoc(hospitalDoc(hid!, COL.reports, id!));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as LabReport) : null;
    },
  });
}

export function useSaveReport() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: Partial<LabReport> & { id: string }) => {
      const { id, ...data } = report;
      const payload: Record<string, unknown> = { ...data, id };
      if (!("createdAt" in data)) payload.createdAt = serverTimestamp();
      await setDoc(hospitalDoc(hid!, COL.reports, id), payload, { merge: true });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports", hid] }),
  });
}

export function useDeleteReport() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteDoc(hospitalDoc(hid!, COL.reports, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports", hid] }),
  });
}

/* ── Test catalog ───────────────────────────────────────────────────────── */
export function useTestCatalog() {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["catalog", hid],
    enabled: !!hid,
    queryFn: async () => rows<TestCatalogItem>(await getDocs(hospitalCol(hid!, COL.catalog))),
  });
}

/**
 * Upsert price/active for a test, matched by testName (catalog docs use
 * auto-ids keyed by testName, written by the Flutter sync). Updates the
 * existing doc when present; otherwise creates a minimal doc with the
 * template's category so the Flutter app can still resolve it.
 */
export function useSaveCatalogPrice() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: { testName: string; category: string; price: number; isActive: boolean }) => {
      const col = hospitalCol(hid!, COL.catalog);
      const existing = await getDocs(query(col, where("testName", "==", item.testName)));
      if (!existing.empty) {
        await setDoc(existing.docs[0].ref, { price: item.price, isActive: item.isActive }, { merge: true });
      } else {
        await setDoc(fbDoc(col), {
          testName: item.testName,
          category: item.category,
          price: item.price,
          isActive: item.isActive,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catalog", hid] }),
  });
}

/* ── Patients ───────────────────────────────────────────────────────────── */
export function usePatients() {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["patients", hid],
    enabled: !!hid,
    queryFn: async () => {
      const q = query(hospitalCol(hid!, COL.patients), orderBy("lastVisit", "desc"), fbLimit(200));
      return rows<LabPatient>(await getDocs(q));
    },
  });
}

export function usePatient(id?: string) {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["patient", hid, id],
    enabled: !!hid && !!id,
    queryFn: async () => {
      const snap = await getDoc(hospitalDoc(hid!, COL.patients, id!));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as LabPatient) : null;
    },
  });
}

export function usePatientReports(phone?: string) {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["patientReports", hid, phone],
    enabled: !!hid && !!phone,
    queryFn: async () => {
      const q = query(hospitalCol(hid!, COL.reports), where("phone", "==", phone));
      return rows<LabReport>(await getDocs(q));
    },
  });
}

export function useSavePatient() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: LabPatient) => {
      const { id, ...data } = p;
      await setDoc(hospitalDoc(hid!, COL.patients, id), data, { merge: true });
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients", hid] }),
  });
}

/* ── Referrers ──────────────────────────────────────────────────────────── */
export function useReferrers() {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["referrers", hid],
    enabled: !!hid,
    queryFn: async () => rows<Referrer>(await getDocs(hospitalCol(hid!, COL.referrers))),
  });
}

/* ── Invoices ───────────────────────────────────────────────────────────── */
export function useInvoices() {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["invoices", hid],
    enabled: !!hid,
    queryFn: async () => {
      const q = query(hospitalCol(hid!, COL.invoices), orderBy("date", "desc"), fbLimit(200));
      return rows<InvoiceModel>(await getDocs(q));
    },
  });
}

/* ── Staff ──────────────────────────────────────────────────────────────── */
export interface StaffMember {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
}

export function useStaff() {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["staff", hid],
    enabled: !!hid,
    queryFn: async () => {
      const q = query(collection(requireDb(), "users"), where("hospital_id", "==", hid));
      return rows<StaffMember>(await getDocs(q));
    },
  });
}

/* ── Activity log ───────────────────────────────────────────────────────── */
export function useActivityLog() {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["activity", hid],
    enabled: !!hid,
    queryFn: async () => {
      const q = query(hospitalCol(hid!, COL.activity), orderBy("timestamp", "desc"), fbLimit(200));
      return rows<LabActivityLog>(await getDocs(q));
    },
  });
}
