import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import type { HospitalConfig, InvoiceModel } from "../types";

// pdfmake vfs wiring (browser)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

const PRIMARY = "#00535B";
const BLACK = "#1A1A1A";
const GREY = "#555555";
const MIDGREY = "#888888";
const LINE = "#CCCCCC";

/** Read a config value preferring Flutter snake_case, then camelCase. */
function cfg(c: HospitalConfig, snake: string, camel?: string): string {
  const v = (c[snake] ?? (camel ? c[camel] : undefined)) as unknown;
  return v == null ? "" : String(v);
}

/** Firestore Timestamp | Date | string → Date. */
function toDate(v: unknown): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === "function") return t.toDate();
  if (typeof t.seconds === "number") return new Date(t.seconds * 1000);
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? new Date() : d;
}

function fmtDate(v: unknown): string {
  return toDate(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(v: unknown): string {
  return toDate(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
const n2 = (n: number) => (n ?? 0).toFixed(2);

/** Indian-system rupees-to-words for the "Received with Thanks" line. */
function rupeesInWords(amount: number): string {
  const num = Math.floor(amount);
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (x: number): string => x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? " " + ones[x % 10] : ""}`;
  const threeDigits = (x: number): string => `${x >= 100 ? ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : ""}${twoDigits(x % 100)}`;
  let words = "";
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;
  if (crore) words += twoDigits(crore) + " Crore ";
  if (lakh) words += twoDigits(lakh) + " Lakh ";
  if (thousand) words += twoDigits(thousand) + " Thousand ";
  if (rest) words += threeDigits(rest);
  return words.trim();
}

function header(config: HospitalConfig, logo?: string): Content {
  const name = (cfg(config, "name", "hospital_name") || "DIAGNOSTIC LABORATORY").toUpperCase();
  const subtitle = cfg(config, "report_header_subtitle", "reportHeaderSubtitle");
  const address = cfg(config, "address");
  const contact = cfg(config, "contact_number", "contactNumber");
  const email = cfg(config, "email");
  const website = cfg(config, "website_url", "websiteUrl");
  const regNo = cfg(config, "registration_number", "registrationNumber");
  const gstin = config.enable_gst ? cfg(config, "gst_number", "gstNumber") : "";

  return {
    stack: [
      {
        columns: [
          ...(logo ? [{ width: 42, image: logo, fit: [40, 40], margin: [0, 0, 8, 0] } as Content] : []),
          {
            width: "*",
            stack: [
              { text: name, fontSize: 14, bold: true, color: PRIMARY },
              ...(subtitle ? [{ text: subtitle, fontSize: 8, color: GREY } as Content] : []),
              ...(regNo ? [{ text: "Reg. No.: " + regNo, fontSize: 6.5, color: MIDGREY } as Content] : []),
              ...(gstin ? [{ text: "GSTIN: " + gstin, fontSize: 6.5, color: MIDGREY } as Content] : []),
            ],
          },
          {
            width: "auto",
            alignment: "right",
            stack: [
              ...(contact ? [{ text: "Ph: " + contact, fontSize: 7.5, color: GREY } as Content] : []),
              ...(email ? [{ text: email, fontSize: 7.5, color: GREY } as Content] : []),
              ...(website ? [{ text: website, fontSize: 7.5, color: GREY } as Content] : []),
              ...(address ? [{ text: address, fontSize: 7, color: GREY, width: 150 } as Content] : []),
            ],
          },
        ],
      },
      { canvas: [{ type: "line", x1: 0, y1: 4, x2: 515, y2: 4, lineWidth: 1.5, lineColor: PRIMARY }] },
    ],
    margin: [0, 0, 0, 8],
  };
}

function kv(k: string, v: string, bold = false): Content {
  return { text: [{ text: k + " : ", fontSize: 8, bold: true, color: GREY }, { text: v, fontSize: bold ? 9.5 : 8.5, bold, color: BLACK }], margin: [0, 0.5, 0, 0.5] };
}

function patientInfo(inv: InvoiceModel): Content {
  return {
    table: {
      widths: ["*", "auto"],
      body: [[
        { stack: [
          kv("Patient Name", inv.patientName || "—", true),
          ...(inv.age ? [kv("Age / Sex", `${inv.age} Yrs / ${inv.gender ?? ""}`)] : []),
          ...(inv.patientUhid ? [kv("UHID", inv.patientUhid)] : []),
          ...(inv.phone ? [kv("Phone", inv.phone)] : []),
        ], border: [true, true, true, true] },
        { stack: [
          kv("Date", fmtDate(inv.date)),
          ...(inv.invoiceNumber ? [kv("Invoice No.", inv.invoiceNumber)] : []),
        ], alignment: "right", border: [true, true, true, true] },
      ]],
    },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.8, vLineWidth: () => 0.8 },
  };
}

function invoiceTable(inv: InvoiceModel): Content {
  const head = ["Particulars", "Date", "Rate (Rs)", "QTY", "Discount", "Tax", "Amount (Rs)"];
  const body: TableCell[][] = [
    head.map((h) => ({ text: h, fontSize: 7.5, bold: true, fillColor: "#F0F0F0", alignment: "center" })),
  ];
  for (const it of inv.lineItems ?? []) {
    body.push([
      { text: it.particulars || "", fontSize: 7.5 },
      { text: fmtDate(it.date ?? inv.date), fontSize: 7.5, alignment: "center" },
      { text: n2(it.rate), fontSize: 7.5, alignment: "center" },
      { text: String(it.quantity ?? 0), fontSize: 7.5, alignment: "center" },
      { text: (it.discountPercent ?? 0) > 0 ? `${(it.discountPercent ?? 0).toFixed(1)}%` : "0.00", fontSize: 7.5, alignment: "center" },
      { text: (it.taxPercent ?? 0) > 0 ? `${(it.taxPercent ?? 0).toFixed(1)}%` : "0.00", fontSize: 7.5, alignment: "center" },
      { text: n2(it.amount), fontSize: 7.5, alignment: "center" },
    ]);
  }
  // "*" on Particulars makes the table fill the full content width (~511pt).
  return {
    table: { headerRows: 1, widths: ["*", 70, 60, 30, 55, 45, 70], body },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
    margin: [0, 6, 0, 0],
  };
}

function totalsRow(label: string, value: string, bold = false): TableCell[] {
  return [
    { text: "", border: [false, false, false, false] },
    { text: label, fontSize: 8, bold, alignment: "right", border: [false, false, false, true] },
    { text: value, fontSize: 8.5, bold, alignment: "right", border: [false, false, false, true] },
  ];
}

function totals(inv: InvoiceModel): Content {
  const rows: TableCell[][] = [totalsRow("Bill Amount :", n2(inv.billAmount))];
  if ((inv.discountTotal ?? 0) > 0) rows.push(totalsRow("Discount :", "-" + n2(inv.discountTotal)));
  if ((inv.taxTotal ?? 0) > 0) rows.push(totalsRow("Tax :", n2(inv.taxTotal)));
  rows.push(totalsRow("Final Bill Amount :", n2(inv.finalBillAmount), true));
  rows.push(totalsRow("Paid Amount :", n2(inv.paidAmount), true));
  // Labels (130) and values (80) align to the right edge of the invoice table.
  return {
    table: { widths: ["*", 130, 80], body: rows },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.3, vLineWidth: () => 0 },
    margin: [0, 4, 0, 0],
  };
}

function receivedLine(inv: InvoiceModel): Content {
  const words = inv.amountInWords || rupeesInWords(inv.paidAmount ?? inv.finalBillAmount ?? 0);
  return {
    table: { widths: ["*"], body: [[{ text: `Received with Thanks: Rs. ${words} Only`, fontSize: 8, bold: true, color: BLACK }]] },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
    margin: [0, 6, 0, 0],
  };
}

function paymentTable(inv: InvoiceModel): Content {
  const head = ["SN", "Receipt No.", "Date", "Invoice No.", "Total Amount (Rs)", "Paymode"];
  // Invoice No. flexes ("*") so the table spans the full content width and lines
  // up edge-to-edge with the invoice table above.
  return {
    table: {
      headerRows: 1,
      widths: [22, 80, 100, "*", 90, 60],
      body: [
        head.map((h) => ({ text: h, fontSize: 7.5, bold: true, fillColor: "#F0F0F0", alignment: "center" })),
        [
          { text: "1", fontSize: 7.5, alignment: "center" },
          { text: inv.receiptNumber || "", fontSize: 7.5, alignment: "center" },
          { text: fmtDateTime(inv.date), fontSize: 7.5, alignment: "center" },
          { text: `${inv.invoiceNumber} (${n2(inv.finalBillAmount)})`, fontSize: 7.5, alignment: "center" },
          { text: n2(inv.paidAmount), fontSize: 7.5, alignment: "center" },
          { text: inv.paymentMode || "Cash", fontSize: 7.5, alignment: "center" },
        ],
      ],
    },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
    margin: [0, 6, 0, 0],
  };
}

function footer(config: HospitalConfig): Content {
  const contact = cfg(config, "contact_number", "contactNumber");
  const email = cfg(config, "email");
  const website = cfg(config, "website_url", "websiteUrl");
  const gstExempt = !config.enable_gst;
  const l1 = [website ? "Website: " + website : "", email ? "E-mail: " + email : ""].filter(Boolean).join("  |  ");
  const l2 = [contact ? "Mob: " + contact : "", "Timings: Open 24x7"].filter(Boolean).join("  |  ");
  return {
    margin: [0, 14, 0, 0],
    stack: [
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: LINE }] },
      ...(l1 ? [{ text: l1, fontSize: 7, color: GREY, alignment: "center", margin: [0, 4, 0, 0] } as Content] : []),
      ...(l2 ? [{ text: l2, fontSize: 7, color: GREY, alignment: "center" } as Content] : []),
      ...(gstExempt ? [{ text: "Healthcare services exempt from GST as per Notification 12/2017-CT(R)", fontSize: 6, color: MIDGREY, alignment: "center", margin: [0, 3, 0, 0] } as Content] : []),
    ],
  };
}

/** Best-effort fetch of a remote image as a data URL for pdfmake embedding. */
async function fetchAsDataUrl(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result as string);
      fr.onerror = () => resolve(undefined);
      fr.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

export function buildInvoiceDoc(inv: InvoiceModel, config: HospitalConfig, logo?: string): TDocumentDefinitions {
  return {
    pageSize: "A4",
    pageMargins: [42, 32, 42, 28],
    content: [
      header(config, logo),
      patientInfo(inv),
      { text: "Invoice", fontSize: 11, bold: true, color: BLACK, margin: [0, 10, 0, 0] },
      invoiceTable(inv),
      totals(inv),
      receivedLine(inv),
      { text: "Payment", fontSize: 11, bold: true, color: BLACK, margin: [0, 14, 0, 0] },
      paymentTable(inv),
      receivedLine(inv),
      footer(config),
    ],
    defaultStyle: { font: "Roboto" },
  };
}

/** Trigger a browser download of the invoice PDF (embeds the lab logo if set). */
export async function downloadInvoicePdf(inv: InvoiceModel, config: HospitalConfig): Promise<void> {
  const logo = await fetchAsDataUrl(cfg(config, "logo_url", "logoUrl") || undefined);
  await new Promise<void>((resolve) => {
    pdfMake.createPdf(buildInvoiceDoc(inv, config, logo)).download(`Invoice_${inv.invoiceNumber || inv.id}.pdf`, () => resolve());
  });
}
