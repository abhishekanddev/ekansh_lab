import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runTransaction, doc as fbDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireDb, hospitalCol, hospitalDoc, COL } from "../lib/db";
import { useHospitalId } from "../lib/auth";
import type { InvoiceLineItem } from "../lib/types";

export interface CreateInvoiceInput {
  patientName?: string;
  patientUhid?: string;
  age?: string;
  gender?: string;
  phone?: string;
  lineItems: InvoiceLineItem[];
  billAmount: number;
  discountTotal: number;
  taxTotal: number;
  finalBillAmount: number;
  paidAmount: number;
  paymentMode: string;
  reportId?: string;
}

const pad = (n: number) => n.toString().padStart(5, "0");

/** Create an invoice with atomically-incremented invoice & receipt numbers,
 *  mirroring InvoiceService.createInvoice in Flutter (compatible doc shape). */
export function useCreateInvoice() {
  const hid = useHospitalId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const db = requireDb();
      const invCol = hospitalCol(hid!, COL.invoices);
      const docRef = fbDoc(invCol); // auto id
      const invoiceCounter = hospitalDoc(hid!, COL.counters, "invoice_counter");
      const receiptCounter = hospitalDoc(hid!, COL.counters, "receipt_counter");

      const result = await runTransaction(db, async (tx) => {
        const invSnap = await tx.get(invoiceCounter);
        const rcptSnap = await tx.get(receiptCounter);
        const invNext = (invSnap.exists() ? (invSnap.data()?.lastNumber ?? 0) : 0) + 1;
        const rcptNext = (rcptSnap.exists() ? (rcptSnap.data()?.lastNumber ?? 0) : 0) + 1;

        const data = {
          id: docRef.id,
          hospitalId: hid,
          invoiceNumber: `INV ${pad(invNext)}`,
          receiptNumber: `RCPT ${pad(rcptNext)}`,
          patientName: input.patientName ?? "",
          patientUhid: input.patientUhid ?? "",
          age: input.age ?? "",
          gender: input.gender ?? "",
          phone: input.phone ?? "",
          date: serverTimestamp(),
          lineItems: input.lineItems,
          billAmount: input.billAmount,
          discountTotal: input.discountTotal,
          taxTotal: input.taxTotal,
          finalBillAmount: input.finalBillAmount,
          paidAmount: input.paidAmount,
          paymentMode: input.paymentMode,
          reportId: input.reportId ?? null,
          createdAt: serverTimestamp(),
        };

        tx.set(invoiceCounter, { lastNumber: invNext }, { merge: true });
        tx.set(receiptCounter, { lastNumber: rcptNext }, { merge: true });
        tx.set(docRef, data);
        return { id: docRef.id, invoiceNumber: data.invoiceNumber };
      });

      // Link the invoice back onto the report (mirrors InvoiceService.createInvoice).
      if (input.reportId) {
        await setDoc(hospitalDoc(hid!, COL.reports, input.reportId), { invoiceId: result.id }, { merge: true });
      }

      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", hid] });
      qc.invalidateQueries({ queryKey: ["reports", hid] });
    },
  });
}
