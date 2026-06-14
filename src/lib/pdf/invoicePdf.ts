import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import type { HospitalConfig, InvoiceModel } from "../types";

// pdfmake vfs wiring (browser)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

/**
 * Invoice PDF — faithful web port of the Flutter `InvoicePdfService`.
 * Same palette, header, bordered patient box, items table, full-width bordered
 * totals box with right-aligned rows, payment table, standalone payment Total
 * box, and the GST-exempt footer.
 */

const PRIMARY = "#00535B";
const BLACK = "#1A1A1A";
const GREY = "#555555";
const MID_GREY = "#888888";
const LINE = "#CCCCCC";
const HEAD_FILL = "#F0F0F0";

const CONTENT_WIDTH = 511; // A4 (595.28) − 42 − 42

// Invoice items: flex 3 / 2 / 1.5 / 1 / 1.2 / 1 / 1.5 (total 11.2)
const ITEM_WIDTHS = [3, 2, 1.5, 1, 1.2, 1, 1.5].map((f) => (CONTENT_WIDTH * f) / 11.2);
// Payment: flex 0.5 / 2 / 2 / 2 / 2 / 1.5 (total 10)
const PAY_WIDTHS = [0.5, 2, 2, 2, 2, 1.5].map((f) => (CONTENT_WIDTH * f) / 10);

/** Read a config value preferring Flutter snake_case, then camelCase. */
function cfg(c: HospitalConfig, snake: string, camel?: string): string {
  const v = (c[snake] ?? (camel ? c[camel] : undefined)) as unknown;
  return v == null ? "" : String(v);
}

function toDate(v: unknown): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === "function") return t.toDate();
  if (typeof t.seconds === "number") return new Date(t.seconds * 1000);
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? new Date() : d;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** dd, MMM yyyy — matches Flutter DateFormat('dd, MMM yyyy'). */
function fmtDate(v: unknown): string {
  const d = toDate(v);
  return `${String(d.getDate()).padStart(2, "0")}, ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** dd, MMM yyyy hh:mm a — matches Flutter DateFormat('dd, MMM yyyy hh:mm a'). */
function fmtDateTime(v: unknown): string {
  const d = toDate(v);
  let h = d.getHours();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${fmtDate(v)} ${String(h).padStart(2, "0")}:${mm} ${ampm}`;
}

const n2 = (n: number) => (n ?? 0).toFixed(2);

/** Indian-system rupees-to-words for the "Received with Thanks" line. */
function rupeesInWords(amount: number): string {
  const num = Math.floor(amount);
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number): string => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? " " + ones[x % 10] : ""}`);
  const three = (x: number): string => `${x >= 100 ? ones[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : ""}${two(x % 100)}`;
  let words = "";
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;
  if (crore) words += two(crore) + " Crore ";
  if (lakh) words += two(lakh) + " Lakh ";
  if (thousand) words += two(thousand) + " Thousand ";
  if (rest) words += three(rest);
  return words.trim();
}

// ── Header (same construction as the report) ───────────────────────────────
function header(config: HospitalConfig, logo?: string): Content {
  const name = (cfg(config, "name", "hospital_name") || "DIAGNOSTIC LABORATORY").toUpperCase();
  const subtitle = cfg(config, "report_header_subtitle", "reportHeaderSubtitle");
  const address = cfg(config, "address");
  const contact = cfg(config, "contact_number", "contactNumber");
  const email = cfg(config, "email");
  const website = cfg(config, "website_url", "websiteUrl");
  const regNo = cfg(config, "registration_number", "registrationNumber");
  const gstin = config.enable_gst ? cfg(config, "gst_number", "gstNumber") : "";

  const logoCell = (logo
    ? { width: 40, image: logo, fit: [40, 40] }
    : {
        width: 40,
        table: { widths: [40], heights: [40], body: [[{ text: "LOGO", color: PRIMARY, bold: true, fontSize: 8, alignment: "center", margin: [0, 16, 0, 0] }]] },
        layout: { hLineColor: () => PRIMARY, vLineColor: () => PRIMARY, hLineWidth: () => 1, vLineWidth: () => 1, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
      }) as unknown as Content;

  return {
    stack: [
      {
        columns: [
          logoCell,
          { width: 10, text: "" },
          {
            width: "*",
            margin: [0, 7, 0, 0],
            stack: [
              { text: name, fontSize: 14, bold: true, color: PRIMARY, characterSpacing: 0.3 },
              ...(subtitle ? [{ text: subtitle, fontSize: 8, color: GREY } as Content] : []),
              ...(regNo ? [{ text: "Reg. No.: " + regNo, fontSize: 6.5, color: MID_GREY } as Content] : []),
              ...(gstin ? [{ text: "GSTIN: " + gstin, fontSize: 6.5, color: MID_GREY } as Content] : []),
            ],
          },
          {
            width: "auto",
            alignment: "right",
            margin: [0, 3, 0, 0],
            stack: [
              ...(contact ? [{ text: "Ph: " + contact, fontSize: 7.5, color: GREY } as Content] : []),
              ...(email ? [{ text: email, fontSize: 7.5, color: GREY } as Content] : []),
              ...(website ? [{ text: website, fontSize: 7.5, color: GREY } as Content] : []),
              ...(address ? [{ text: address, fontSize: 7, color: GREY, alignment: "right", width: 130 } as Content] : []),
            ],
          },
        ],
        columnGap: 0,
      },
      { text: "", margin: [0, 0, 0, 2.5] },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1.5, lineColor: PRIMARY }] },
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
          ...(inv.age ? [kv("Age / Sex", `${inv.age} Yrs / ${inv.gender ?? ""}`.trim())] : []),
          ...(inv.patientUhid ? [kv("UHID", inv.patientUhid)] : []),
          ...(inv.phone ? [kv("Phone", inv.phone)] : []),
        ], border: [true, true, true, true] },
        { stack: [
          kv("Date", fmtDate(inv.date)),
          ...(inv.invoiceNumber ? [kv("Invoice No.", inv.invoiceNumber)] : []),
        ], alignment: "right", border: [true, true, true, true] },
      ]],
    },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.8, vLineWidth: () => 0.8, paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 6, paddingBottom: () => 6 },
    margin: [0, 0, 0, 10],
  };
}

function invoiceTable(inv: InvoiceModel): Content {
  const head: TableCell[] = ["Particulars", "Date", "Rate (Rs)", "QTY", "Discount", "Tax", "Amount\n(Rs)"].map(
    (h) => ({ text: h, fontSize: 7.5, bold: true, color: BLACK, fillColor: HEAD_FILL, alignment: "center" }),
  );
  const body: TableCell[][] = [head];
  for (const it of inv.lineItems ?? []) {
    body.push([
      { text: it.particulars || "", fontSize: 7.5, color: BLACK, alignment: "center" },
      { text: fmtDate(it.date ?? inv.date), fontSize: 7.5, color: BLACK, alignment: "center" },
      { text: n2(it.rate), fontSize: 7.5, color: BLACK, alignment: "center" },
      { text: String(it.quantity ?? 0), fontSize: 7.5, color: BLACK, alignment: "center" },
      { text: (it.discountPercent ?? 0) > 0 ? `${(it.discountPercent ?? 0).toFixed(1)}%` : "0.00", fontSize: 7.5, color: BLACK, alignment: "center" },
      { text: (it.taxPercent ?? 0) > 0 ? `${(it.taxPercent ?? 0).toFixed(1)}%` : "0.00", fontSize: 7.5, color: BLACK, alignment: "center" },
      { text: n2(it.amount), fontSize: 7.5, color: BLACK, alignment: "center" },
    ]);
  }
  return {
    table: { headerRows: 1, widths: ITEM_WIDTHS, body },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
  };
}

/** Full-width bordered totals box; each row right-aligned. */
function totals(inv: InvoiceModel): Content {
  const row = (label: string, value: string, bold = false): TableCell[] => [
    { text: "", border: [false, false, false, false] },
    { text: label, fontSize: 8, bold, color: BLACK, alignment: "right", border: [false, false, false, false] },
    { text: value, fontSize: 8.5, bold, color: BLACK, alignment: "right", border: [false, false, false, false] },
  ];
  const rows: TableCell[][] = [row("Bill Amount :", n2(inv.billAmount))];
  if ((inv.discountTotal ?? 0) > 0) rows.push(row("Discount :", "-" + n2(inv.discountTotal)));
  if ((inv.taxTotal ?? 0) > 0) rows.push(row("Tax :", n2(inv.taxTotal)));
  rows.push(row("Final Bill Amount :", n2(inv.finalBillAmount), true));
  rows.push(row("Paid Amount :", n2(inv.paidAmount), true));

  const rowCount = rows.length;
  return {
    table: { widths: ["*", "auto", 70], body: rows },
    layout: {
      // Outer box 0.5pt; internal horizontal rules 0.3pt; outer verticals 0.5pt.
      hLineColor: () => LINE, vLineColor: () => LINE,
      hLineWidth: (i: number) => (i === 0 || i === rowCount ? 0.5 : 0.3),
      vLineWidth: (i: number) => (i === 0 || i === 3 ? 0.5 : 0),
      paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 2, paddingBottom: () => 2,
    },
    margin: [0, 4, 0, 0],
  };
}

function receivedLine(inv: InvoiceModel): Content {
  const words = inv.amountInWords || rupeesInWords(inv.paidAmount ?? inv.finalBillAmount ?? 0);
  return {
    table: { widths: ["*"], body: [[{ text: `Received with Thanks: Rs. ${words} Only`, fontSize: 8, bold: true, color: BLACK }]] },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.5, vLineWidth: () => 0.5, paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 4, paddingBottom: () => 4 },
    margin: [0, 6, 0, 0],
  };
}

function paymentTable(inv: InvoiceModel): Content {
  const head: TableCell[] = ["SN", "Receipt No.", "Date", "Invoice No.", "Total Amount (Rs)", "Paymode"].map(
    (h) => ({ text: h, fontSize: 7.5, bold: true, color: BLACK, fillColor: HEAD_FILL, alignment: "center" }),
  );
  return {
    table: {
      headerRows: 1,
      widths: PAY_WIDTHS,
      body: [
        head,
        [
          { text: "1", fontSize: 7.5, color: BLACK, alignment: "center" },
          { text: inv.receiptNumber || "", fontSize: 7.5, color: BLACK, alignment: "center" },
          { text: fmtDateTime(inv.date), fontSize: 7.5, color: BLACK, alignment: "center" },
          { text: `${inv.invoiceNumber} (${n2(inv.finalBillAmount)})`, fontSize: 7.5, color: BLACK, alignment: "center" },
          { text: n2(inv.paidAmount), fontSize: 7.5, color: BLACK, alignment: "center" },
          { text: inv.paymentMode || "Cash", fontSize: 7.5, color: BLACK, alignment: "center" },
        ],
      ],
    },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
  };
}

/** Standalone full-width bordered "Total {paid}" box, right-aligned. */
function paymentTotal(inv: InvoiceModel): Content {
  return {
    table: {
      widths: ["*", "auto", "auto"],
      body: [[
        { text: "", border: [false, false, false, false] },
        { text: "Total", fontSize: 8, bold: true, color: BLACK, alignment: "right", border: [false, false, false, false] },
        { text: n2(inv.paidAmount), fontSize: 8.5, bold: true, color: BLACK, alignment: "right", border: [false, false, false, false], margin: [12, 0, 0, 0] },
      ]],
    },
    layout: { hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.5, vLineWidth: (i: number) => (i === 0 || i === 3 ? 0.5 : 0), paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 3, paddingBottom: () => 3 },
    margin: [0, 4, 0, 0],
  };
}

function footer(config: HospitalConfig): Content {
  const contact = cfg(config, "contact_number", "contactNumber");
  const email = cfg(config, "email");
  const website = cfg(config, "website_url", "websiteUrl");
  const gstExempt = !config.enable_gst;
  const l1 = [website ? "Website: " + website : "", email ? "E-mail: " + email : ""].filter(Boolean).join("  |  ");
  const l2 = [contact ? "Mob: " + contact : "", "Timings: Open 24x7"].filter(Boolean).join(" | ");
  return {
    margin: [42, 0, 42, 0],
    stack: [
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 0.5, lineColor: LINE }] },
      ...(l1 ? [{ text: l1, fontSize: 7, color: GREY, alignment: "center", margin: [0, 4, 0, 0] } as Content] : []),
      ...(l2 ? [{ text: l2, fontSize: 7, color: GREY, alignment: "center" } as Content] : []),
      ...(gstExempt ? [{ text: "Healthcare services exempt from GST as per Notification 12/2017-CT(R)", fontSize: 6, color: MID_GREY, alignment: "center", margin: [0, 3, 0, 0] } as Content] : []),
    ],
  };
}

/** Best-effort fetch of a remote image as a data URL for embedding. */
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
    pageMargins: [42, 32, 42, 60],
    content: [
      header(config, logo),
      patientInfo(inv),
      { text: "Invoice", fontSize: 11, bold: true, color: BLACK, margin: [0, 0, 0, 6] },
      invoiceTable(inv),
      totals(inv),
      receivedLine(inv),
      { text: "Payment", fontSize: 11, bold: true, color: BLACK, margin: [0, 14, 0, 6] },
      paymentTable(inv),
      paymentTotal(inv),
      receivedLine(inv),
    ],
    footer: () => footer(config),
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
