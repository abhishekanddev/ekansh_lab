import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { setDoc } from "firebase/firestore";
import { storage } from "../lib/firebase";
import { useHospitalId } from "../lib/auth";
import { hospitalDoc, COL } from "../lib/db";
import { generateReportBlob, downloadReportPdf } from "../lib/pdf/labReportPdf";
import { useHospitalConfig } from "./useLabData";
import type { HospitalConfig, LabReport } from "../lib/types";

/** Public verify URL embedded in the report QR code. */
export function verifyUrl(hid: string, reportId: string): string {
  return `${window.location.origin}/verify?r=${encodeURIComponent(hid)}/${encodeURIComponent(reportId)}`;
}

/** Generate the PDF, upload to Storage, and persist pdfUrl on the report. */
export function useGenerateReportPdf() {
  const hid = useHospitalId();
  const config = useHospitalConfig();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: LabReport) => {
      if (!storage || !hid) throw new Error("Not ready");
      const url = verifyUrl(hid, report.id);
      const blob = await generateReportBlob(report, (config.data ?? {}) as HospitalConfig, url);
      const path = `hospitals/${hid}/lab_reports/${report.id}.pdf`;
      const r = ref(storage, path);
      await uploadBytes(r, blob, { contentType: "application/pdf" });
      const pdfUrl = await getDownloadURL(r);
      await setDoc(hospitalDoc(hid, COL.reports, report.id), { pdfUrl }, { merge: true });
      return pdfUrl;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", hid] });
    },
  });
}

/** Download the PDF locally without uploading (uses current branding config). */
export function useDownloadReportPdf() {
  const hid = useHospitalId();
  const config = useHospitalConfig();
  return useMutation({
    mutationFn: async (report: LabReport) => {
      const url = hid ? verifyUrl(hid, report.id) : "";
      await downloadReportPdf(report, (config.data ?? {}) as HospitalConfig, url);
    },
  });
}
