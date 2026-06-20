import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc as fbDoc,
  query,
  orderBy,
  limit as fbLimit,
  where,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { useHospitalId, useAuth } from "../lib/auth";
import { collection } from "firebase/firestore";
import { hospitalCol, hospitalDoc, hospitalRef, COL, requireDb, logActivity } from "../lib/db";
import { normalizePhone } from "../lib/reportBuilder";
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
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: Partial<LabReport> & { id: string }) => {
      const { id, ...data } = report;
      const payload: Record<string, unknown> = { ...data, id };
      // A brand-new report has no createdAt yet; edits already carry one.
      const isNew = !("createdAt" in data);
      if (isNew) payload.createdAt = serverTimestamp();
      await setDoc(hospitalDoc(hid!, COL.reports, id), payload, { merge: true });
      if (isNew) {
        try {
          await logActivity(hid, {
            action: "report_created",
            target_name: report.patientName || report.testType || id,
            performed_by: user?.name,
            performed_by_uid: user?.uid,
          });
        } catch { /* audit logging is best-effort */ }
      }
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports", hid] }),
  });
}

export function useDeleteReport() {
  const hid = useHospitalId();
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Capture the patient name before deletion so the audit entry is meaningful.
      let targetName = id;
      try {
        const snap = await getDoc(hospitalDoc(hid!, COL.reports, id));
        if (snap.exists()) {
          const d = snap.data() as Partial<LabReport>;
          targetName = d.patientName || d.testType || id;
        }
      } catch { /* fall back to id */ }
      await deleteDoc(hospitalDoc(hid!, COL.reports, id));
      try {
        await logActivity(hid, {
          action: "report_deleted",
          target_name: targetName,
          performed_by: user?.name,
          performed_by_uid: user?.uid,
        });
      } catch { /* audit logging is best-effort */ }
    },
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
  const { user } = useAuth();
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
      try {
        await logActivity(hid, {
          action: "price_updated",
          target_name: item.testName,
          performed_by: user?.name,
          performed_by_uid: user?.uid,
          metadata: { price: item.price },
        });
      } catch { /* audit logging is best-effort */ }
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

/** Look up an existing patient by phone (lab_patients doc id = 10-digit phone). */
export function usePatientByPhone(phone?: string) {
  const hid = useHospitalId();
  const clean = normalizePhone(phone ?? "");
  return useQuery({
    queryKey: ["patientByPhone", hid, clean],
    enabled: !!hid && clean.length === 10,
    queryFn: async () => {
      const snap = await getDoc(hospitalDoc(hid!, COL.patients, clean));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as LabPatient) : null;
    },
  });
}

/**
 * Upsert a patient by phone and return their UHID, generating a sequential
 * `EP-0001` via the `uhid_counter` in a transaction — mirrors the Flutter
 * `LabPatientService.saveOrUpdatePatient`. Reuses an existing UHID when set.
 */
export function useUpsertPatientUhid() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { phone: string; name: string; age: string; gender: string; title?: string }) => {
      const phone = normalizePhone(p.phone);
      if (phone.length < 10) return null;
      const dbi = requireDb();
      const patientRef = hospitalDoc(hid!, COL.patients, phone);
      const counterRef = hospitalDoc(hid!, COL.counters, "uhid_counter");

      return await runTransaction(dbi, async (tx) => {
        const snap = await tx.get(patientRef);
        const genUhid = async (): Promise<string> => {
          const cs = await tx.get(counterRef);
          const last = cs.exists() ? ((cs.data().lastNumber as number) ?? 0) : 0;
          const next = last + 1;
          tx.set(counterRef, { lastNumber: next }, { merge: true });
          return `EP-${String(next).padStart(4, "0")}`;
        };

        if (snap.exists()) {
          const data = snap.data();
          const existing = (data.uhid as string | undefined) ?? "";
          const uhid = existing || (await genUhid());
          tx.update(patientRef, {
            name: p.name, age: p.age, gender: p.gender, title: p.title ?? "",
            lastVisit: serverTimestamp(),
            totalVisits: ((data.totalVisits as number) ?? 1) + 1,
            ...(existing ? {} : { uhid }),
          });
          return uhid;
        }
        const uhid = await genUhid();
        tx.set(patientRef, {
          id: phone, hospitalId: hid, phone, name: p.name, age: p.age, gender: p.gender, title: p.title ?? "",
          lastVisit: serverTimestamp(), totalVisits: 1, uhid, registrationDate: serverTimestamp(),
        });
        return uhid;
      });
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
    queryFn: async () => {
      const list = rows<Referrer>(await getDocs(hospitalCol(hid!, COL.referrers)));
      // SELF first, then alphabetical — matches Flutter ordering.
      return list.sort((a, b) => {
        if (a.isSelf && !b.isSelf) return -1;
        if (!a.isSelf && b.isSelf) return 1;
        return (a.name ?? "").toLowerCase().localeCompare((b.name ?? "").toLowerCase());
      });
    },
  });
}

/** Add a new referrer (doctor); returns the new doc id. */
export function useAddReferrer() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Omit<Referrer, "id">) => {
      const ref = fbDoc(hospitalCol(hid!, COL.referrers));
      await setDoc(ref, { ...r, id: ref.id, createdAt: serverTimestamp() });
      return ref.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referrers", hid] }),
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
  is_active?: boolean;
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

export function useCreateStaffAccount() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; email: string; password: string }) => {
      if (!functions) throw new Error("Firebase not configured");
      const fn = httpsCallable<
        { name: string; email: string; password: string; hospital_id: string },
        { success: boolean; uid?: string; message?: string }
      >(functions, "createStaffAccount");
      const res = await fn({ ...params, hospital_id: hid! });
      if (!res.data.success) throw new Error(res.data.message ?? "Failed to create staff account");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", hid] }),
  });
}

export function useToggleStaffStatus() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, newStatus }: { staffId: string; newStatus: boolean }) => {
      await updateDoc(fbDoc(requireDb(), "users", staffId), { is_active: newStatus });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", hid] }),
  });
}

/* ── Current user profile (users/{uid}) ─────────────────────────────────── */
export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  hospital_id?: string;
  hospital_name?: string;
  designation?: string;
}

export function useMyProfile(uid?: string) {
  return useQuery({
    queryKey: ["profile", uid],
    enabled: !!uid,
    queryFn: async () => {
      const snap = await getDoc(fbDoc(requireDb(), "users", uid!));
      return (snap.exists() ? snap.data() : {}) as UserProfile;
    },
  });
}

export function useSaveMyProfile(uid?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<UserProfile>) => {
      await setDoc(fbDoc(requireDb(), "users", uid!), patch, { merge: true });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", uid] }),
  });
}

/* ── Staff permissions ──────────────────────────────────────────────────── */
/**
 * Configurable staff capability flags, stored once per lab at
 * `hospitals/{hid}/settings/lab_staff_permissions` (snake_case keys, written by
 * the Flutter owner UI). The lab owner (role === "hospital") always has full
 * access; these flags only restrict "staff"-role users.
 */
export interface StaffPermissions {
  can_view_analytics?: boolean;
  can_edit_prices?: boolean;
  can_delete_reports?: boolean;
  can_edit_lab_info?: boolean;
  can_seed_catalog?: boolean;
}

export function useStaffPermissions() {
  const hid = useHospitalId();
  return useQuery({
    queryKey: ["staffPermissions", hid],
    enabled: !!hid,
    queryFn: async () => {
      const snap = await getDoc(hospitalDoc(hid!, COL.settings, "lab_staff_permissions"));
      return (snap.exists() ? snap.data() : {}) as StaffPermissions;
    },
  });
}

/**
 * Whether the current user may delete reports. Mirrors the Flutter
 * `labCanDeleteReportsProvider`: the lab owner (role === "hospital") always can;
 * staff need the explicit `can_delete_reports` flag. UI-only — Firestore rules
 * must enforce the same restriction server-side.
 */
export function useCanDeleteReports(): boolean {
  const { user } = useAuth();
  const perms = useStaffPermissions();
  if (user?.role === "hospital") return true;
  return perms.data?.can_delete_reports === true;
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
