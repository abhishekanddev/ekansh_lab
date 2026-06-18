import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { useHospitalId } from "../lib/auth";
import type { LabReport } from "../lib/types";

/** Public verify URL embedded in the report QR code. */
export function verifyUrl(hid: string, reportId: string): string {
  return `${window.location.origin}/verify?r=${encodeURIComponent(hid)}/${encodeURIComponent(reportId)}`;
}

/**
 * Generate the PDF server-side via the Puppeteer cloud function.
 *
 * The cloud function fetches report data + hospital config from Firestore,
 * renders HTML → PDF via headless Chrome, uploads to Storage, and returns pdfUrl.
 */
export function useGenerateReportPdf() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: LabReport) => {
      if (!functions || !hid) throw new Error("Not ready");
      const callable = httpsCallable<
        { hospitalId: string; reportId: string },
        { pdfUrl: string }
      >(functions, "generateLabReportPdf");

      const result = await callable({
        hospitalId: hid,
        reportId: report.id,
      });

      return result.data.pdfUrl;
    },
    onSuccess: (_pdfUrl, report) => {
      qc.invalidateQueries({ queryKey: ["reports", hid] });
      qc.invalidateQueries({ queryKey: ["report", hid, report.id] });
    },
  });
}

/** Download the PDF locally — calls the same cloud function, then opens the URL. */
export function useDownloadReportPdf() {
  const hid = useHospitalId();
  return useMutation({
    mutationFn: async (report: LabReport) => {
      if (!functions || !hid) throw new Error("Not ready");

      // If the report already has a PDF URL, open it directly.
      if (report.pdfUrl) {
        window.open(report.pdfUrl, "_blank");
        return;
      }

      // Otherwise generate via cloud function.
      const callable = httpsCallable<
        { hospitalId: string; reportId: string },
        { pdfUrl: string }
      >(functions, "generateLabReportPdf");

      const result = await callable({
        hospitalId: hid,
        reportId: report.id,
      });

      window.open(result.data.pdfUrl, "_blank");
    },
  });
}
