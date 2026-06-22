import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import type { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import type { HospitalConfig, LabParameter, LabReport } from "../types";
import { generateBlocks, type InterpretationBlock } from "../interpretationEngine";
import { computeFlag } from "../labLogic";

// pdfmake vfs wiring (browser)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

/**
 * Lab report PDF — faithful web port of the Flutter `LabReportPdfService`.
 * Same palette, layout, spacing, empty-field omission, section grouping,
 * H/L "(H)"/"(L)" markers, Widal / sensitivity grids, signatures and footer.
 */

// ── Colors (ink-efficient palette — identical to Flutter) ──────────────────
const PRIMARY = "#00535B";
const BLACK = "#1A1A1A";
const GREY = "#555555";
const MID_GREY = "#888888";
const LINE_GREY = "#CCCCCC";
const FAINT_GREY = "#E8E8E8";
const RED = "#CC0000";

const CONTENT_WIDTH = 511; // A4 (595.28) − 42 − 42 margins

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

/** dd/MM/yyyy — matches Flutter DateFormat. */
function fmtDate(v: unknown): string {
  const d = toDate(v);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Render a Code128 barcode to a PNG data URL (mirrors Flutter BarcodeWidget). */
function code128DataUrl(data: string): string {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, data, { format: "CODE128", width: 1.1, height: 28, displayValue: false, margin: 0 });
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
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

interface Assets {
  logo?: string;
  qr?: string;
  techSig?: string;
  pathSig?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Header (lab letterhead)
// ═══════════════════════════════════════════════════════════════════════════
function headerWidget(config: HospitalConfig, assets: Assets): Content {
  const name = (cfg(config, "name", "hospital_name") || "DIAGNOSTIC LABORATORY").toUpperCase();
  const subtitle = cfg(config, "report_header_subtitle", "reportHeaderSubtitle") || "Pathology & Diagnostic Laboratory";
  const address = cfg(config, "address");
  const contact = cfg(config, "contact_number", "contactNumber");
  const email = cfg(config, "email");
  const website = cfg(config, "website_url", "websiteUrl");
  const regNo = cfg(config, "registration_number", "registrationNumber");

  const logoCell = (assets.logo
    ? { width: 40, image: assets.logo, fit: [40, 40] }
    : {
        width: 40,
        // Exact 40×40 box (Flutter Container 40×40, 1pt primary border).
        // Zero cell padding so the box doesn't inflate; margin centres "LOGO".
        table: { widths: [40], heights: [40], body: [[{ text: "LOGO", color: PRIMARY, bold: true, fontSize: 8, alignment: "center", margin: [0, 16, 0, 0] }]] },
        layout: {
          hLineColor: () => PRIMARY, vLineColor: () => PRIMARY,
          hLineWidth: () => 1, vLineWidth: () => 1,
          paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0,
        },
      }) as unknown as Content;

  return {
    stack: [
      {
        columns: [
          logoCell,
          { width: 10, text: "" },
          {
            width: "*",
            // Nudge down so the name vertically centres against the 40pt logo,
            // matching Flutter's Row crossAxisAlignment: center.
            margin: [0, 7, 0, 0],
            stack: [
              { text: name, fontSize: 14, bold: true, color: PRIMARY, characterSpacing: 0.3 },
              ...(subtitle ? [{ text: subtitle, fontSize: 8, color: GREY } as Content] : []),
              ...(regNo ? [{ text: "Reg. No.: " + regNo, fontSize: 6.5, color: MID_GREY } as Content] : []),
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
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Patient info grid
// ═══════════════════════════════════════════════════════════════════════════
function patientKv(key: string, value: string, bold = false): Content {
  return {
    columns: [
      { width: 55, text: key, fontSize: 9, color: GREY },
      { width: "auto", text: ":", fontSize: 9, color: GREY },
      { width: "*", text: value, fontSize: bold ? 10 : 9, bold: true, color: BLACK },
    ],
    columnGap: 3,
    margin: [0, 0.5, 0, 0.5],
  };
}

function patientInfoGrid(report: LabReport, assets: Assets, verificationCode?: string): Content {
  const fd = report.formData ?? {};
  const rec = report as unknown as Record<string, unknown>;
  const title = (fd.title as string) ?? "";
  const baseName = report.patientName ?? "";
  const name = title ? `${title} ${baseName}`.trim() : baseName;
  const age = (fd.age as string) ?? "";
  const gender = (fd.gender as string) ?? "";
  const phone = report.phone ?? (fd.phone as string) ?? "";
  const referredBy = report.referredBy ?? "";
  const uhid = (rec.patientUhid as string) ?? (fd.patientId as string) ?? "";

  const barcodeData = uhid || (report.id.length > 10 ? report.id.slice(-10) : report.id);
  const barcodeImg = code128DataUrl(barcodeData);

  // Left column — omit fields that have no value (#1). Tight vertical spacing
  // to match the mobile PDF (no extra spacer rows between KVs).
  const leftStack: Content[] = [];
  if (name) leftStack.push(patientKv("Patient Name", name, true));
  leftStack.push(patientKv("Age/Gender", [age, gender].filter(Boolean).join(" / ")));
  if (referredBy) leftStack.push(patientKv("Referred by", referredBy));
  if (uhid) leftStack.push(patientKv("UHID", uhid));
  if (phone) leftStack.push(patientKv("Phone", phone));

  const dateKv = (k: string, v: string): Content => ({
    columns: [
      { width: 55, text: k, fontSize: 9, color: GREY },
      { width: "auto", text: ":", fontSize: 9, color: GREY },
      { width: "*", text: v, fontSize: 9, bold: true, color: BLACK },
    ],
    columnGap: 3,
    margin: [0, 0.5, 0, 0.5],
  });

  const middleStack: Content[] = [
    {
      columns: [
        ...(barcodeImg ? [{ width: 70, image: barcodeImg, height: 16 } as Content] : []),
        { width: "auto", text: barcodeData, fontSize: 7.5, bold: true, color: BLACK, margin: [4, 5, 0, 0] },
      ],
      columnGap: 0,
    },
    dateKv("Reg. Date", fmtDate(report.createdAt)),
    dateKv("Collection", fmtDate((fd.collectionDate as unknown) ?? report.createdAt)),
    dateKv("Report Date", fmtDate((fd.reportDate as unknown) ?? report.createdAt)),
  ];

  const rightStack: Content[] = [];
  if (assets.qr) rightStack.push({ image: assets.qr, width: 42, height: 42, alignment: "center" });
  if (verificationCode) rightStack.push({ text: verificationCode, fontSize: 6, bold: true, color: BLACK, alignment: "center" });
  rightStack.push({ text: "Scan to\nVerify", fontSize: 5.5, color: MID_GREY, italics: true, alignment: "center" });

  return {
    table: {
      widths: ["*", "*", 55],
      // Full bordered box (mockup .pgrid: 1.1px #CCCCCC all sides) plus the two
      // internal vertical dividers between the three columns.
      body: [[
        { stack: leftStack, border: [true, true, true, true] },
        { stack: middleStack, border: [false, true, true, true] },
        { stack: rightStack, border: [false, true, true, true], alignment: "center" },
      ]],
    },
    layout: {
      hLineColor: () => LINE_GREY, vLineColor: () => LINE_GREY,
      hLineWidth: () => 0.8, vLineWidth: () => 0.8,
      paddingLeft: () => 5, paddingRight: () => 5, paddingTop: () => 5, paddingBottom: () => 5,
    },
    margin: [0, 0, 0, 4],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Test title + banner
// ═══════════════════════════════════════════════════════════════════════════
function testTitle(testType: string): Content {
  return {
    table: { widths: ["*"], body: [[{ text: testType.toUpperCase(), fontSize: 11, bold: true, color: BLACK, characterSpacing: 0.8, alignment: "center", border: [false, false, false, true] }]] },
    layout: { hLineColor: () => LINE_GREY, hLineWidth: () => 0.8, vLineWidth: () => 0, paddingTop: () => 4, paddingBottom: () => 3 },
    margin: [0, 4, 0, 0],
  };
}

const RESULT_WIDTHS = [
  CONTENT_WIDTH * (4.0 / 10.0),
  CONTENT_WIDTH * (1.8 / 10.0),
  CONTENT_WIDTH * (1.7 / 10.0),
  CONTENT_WIDTH * (2.5 / 10.0),
];

function testBanner(): Content {
  const hcell = (t: string, align: "left" | "center" = "left"): TableCell => ({ text: t, fontSize: 8.5, bold: true, color: GREY, characterSpacing: 0.4, alignment: align, border: [false, false, false, true] });
  return {
    table: { widths: RESULT_WIDTHS, body: [[hcell("TEST NAME"), hcell("VALUE", "center"), hcell("UNIT", "center"), hcell("REFERENCE RANGE", "center")]] },
    layout: { hLineColor: () => BLACK, hLineWidth: () => 1, vLineWidth: () => 0, paddingTop: () => 3, paddingBottom: () => 3, paddingLeft: () => 4, paddingRight: () => 4 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Results table — skips empty values, section headers, H/L markers
// ═══════════════════════════════════════════════════════════════════════════
function resultsTable(results: LabParameter[]): Content {
  const body: TableCell[][] = [];

  // Group consecutive/interleaved params by section so each section header is
  // emitted only once. Lab data often interleaves a section with its sibling
  // (e.g. Differential / Absolute alternating per analyte); iterating in raw
  // order would re-emit the header on every switch. We bucket by section while
  // preserving first-appearance order of both sections and standalone params.
  type Slot = { section: string | null; params: LabParameter[] };
  const slots: Slot[] = [];
  const sectionSlot = new Map<string, Slot>();
  for (const p of results) {
    if (!(p.value ?? "").trim()) continue;
    const sec = p.section || null;
    if (sec) {
      let slot = sectionSlot.get(sec);
      if (!slot) {
        slot = { section: sec, params: [] };
        sectionSlot.set(sec, slot);
        slots.push(slot);
      }
      slot.params.push(p);
    } else {
      slots.push({ section: null, params: [p] });
    }
  }

  const cell = (text: string, opts: { bold?: boolean; color?: string; fontSize?: number; align?: "left" | "center"; margin?: [number, number, number, number] } = {}): TableCell => ({
    text, fontSize: opts.fontSize ?? 9.5, bold: opts.bold, color: opts.color ?? BLACK, alignment: opts.align ?? "left",
    ...(opts.margin ? { margin: opts.margin } : {}),
  });

  for (const slot of slots) {
    const underSection = !!slot.section;
    if (slot.section) {
      body.push([
        { columns: [{ canvas: [{ type: "rect", x: 0, y: 0, w: 2, h: 10, color: PRIMARY }], width: 2 }, { text: slot.section, fontSize: 9.5, bold: true, color: BLACK, margin: [4, 0, 0, 0] }], columnGap: 0, margin: [4, 5, 0, 2], border: [false, false, false, false] },
        { text: "", border: [false, false, false, false] },
        { text: "", border: [false, false, false, false] },
        { text: "", border: [false, false, false, false] },
      ]);
    }

    for (const param of slot.params) {
      const flag = computeFlag(param.value, param.range) ?? param.flag ?? null;
      const abnormal = flag != null;
      const marker = flag === "H" || flag === "HIGH" ? "H" : "L";
      const displayValue = abnormal ? `${param.value} (${marker})` : param.value;

      body.push([
        // Indent section sub-params with a real left margin (pdfmake collapses
        // leading spaces, unlike Flutter's pdf engine). 18pt reads clearly at
        // the PDF zoom levels users actually view at.
        cell(param.parameter, { bold: abnormal || !underSection, margin: underSection ? [18, 0, 0, 0] : undefined }),
        cell(displayValue, { bold: abnormal, color: abnormal ? RED : BLACK, align: "center" }),
        cell(param.unit ?? "", { color: GREY, fontSize: 8.5, align: "center" }),
        cell(param.range ?? "", { color: GREY, fontSize: 8.5, align: "center" }),
      ]);
    }
  }

  return {
    table: { widths: RESULT_WIDTHS, body },
    layout: {
      hLineColor: () => FAINT_GREY,
      hLineWidth: (i: number) => (i === 0 || i === body.length ? 0 : 0.5),
      vLineWidth: () => 0,
      paddingTop: () => 2.5, paddingBottom: () => 2.5, paddingLeft: () => 4, paddingRight: () => 4,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Sensitivity grid (C&S)
// ═══════════════════════════════════════════════════════════════════════════
function sensitivityGrid(param: LabParameter): Content | null {
  const gridData = (param.gridData ?? {}) as Record<string, Record<string, unknown>>;
  const entries = Object.entries(gridData);
  if (entries.length === 0) return null;
  const color = (s: string) => (s === "S" ? "#1B5E20" : s === "I" ? "#E65100" : s === "R" ? RED : BLACK);

  const body: TableCell[][] = [[
    { text: "ANTIBIOTIC", bold: true, color: "white", fontSize: 9, fillColor: PRIMARY },
    { text: "SENSITIVITY", bold: true, color: "white", fontSize: 9, alignment: "center", fillColor: PRIMARY },
  ]];
  for (const [ab, v] of entries) {
    const s = (v.sensitivity as string) ?? "";
    body.push([
      { text: ab, fontSize: 9, color: BLACK },
      { text: s, bold: true, color: color(s), fontSize: 9, alignment: "center" },
    ]);
  }
  return {
    stack: [
      {
        table: { widths: [CONTENT_WIDTH * (4 / 5.5), CONTENT_WIDTH * (1.5 / 5.5)], body },
        layout: { hLineColor: () => LINE_GREY, vLineColor: () => LINE_GREY, hLineWidth: () => 0.4, vLineWidth: () => 0.4, paddingLeft: () => 6, paddingTop: () => 3, paddingBottom: () => 3 },
      },
      { text: "S = Sensitive    I = Intermediate    R = Resistant", fontSize: 8, color: GREY, margin: [0, 3, 0, 0] },
    ],
    margin: [0, 6, 0, 0],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Result widgets dispatcher (standard table + grids)
// ═══════════════════════════════════════════════════════════════════════════
function buildResultWidgets(results: LabParameter[]): Content[] {
  const standard = results.filter((p) => p.inputType !== "grid" && p.inputType !== "sensitivityGrid");
  const grids = results.filter((p) => p.inputType === "grid" || p.inputType === "sensitivityGrid");
  const widgets: Content[] = [];

  if (standard.some((p) => (p.value ?? "").trim())) widgets.push(resultsTable(standard));

  for (const gp of grids) {
    if (gp.inputType === "sensitivityGrid") {
      const g = sensitivityGrid(gp);
      if (g) widgets.push(g);
    } else {
      // Widal/agglutination grid — render its computed summary value if present.
      if ((gp.value ?? "").trim()) {
        widgets.push({ text: `${gp.parameter}: ${gp.value}`, fontSize: 9.5, color: BLACK, margin: [0, 6, 0, 0] });
      }
    }
  }
  return widgets;
}

// ═══════════════════════════════════════════════════════════════════════════
// Interpretation / observation block
// ═══════════════════════════════════════════════════════════════════════════
function interpretationBlocksContent(blocks: InterpretationBlock[]): Content {
  const inner: Content[] = [
    { text: "Interpretation / Observation:", fontSize: 9.5, bold: true, color: BLACK },
    { text: "", margin: [0, 1.5, 0, 0] },
  ];
  for (const b of blocks) {
    if (b.kind === "text") {
      inner.push({ text: b.text, fontSize: 9, bold: b.bold, color: GREY, lineHeight: 1.3, margin: [0, 0, 0, 4] });
    } else {
      if (b.title) inner.push({ text: b.title, fontSize: 8.5, bold: true, margin: [0, 4, 0, 4] });
      const tbody: TableCell[][] = [b.headers.map((h) => ({ text: h, fontSize: 8, bold: true, fillColor: FAINT_GREY }))];
      for (const row of b.rows) tbody.push(row.map((c) => ({ text: c, fontSize: 8 })));
      inner.push({
        table: { headerRows: 1, widths: b.headers.map(() => "*"), body: tbody },
        layout: { hLineColor: () => LINE_GREY, vLineColor: () => LINE_GREY, hLineWidth: () => 0.5, vLineWidth: () => 0.5 },
        margin: [0, 0, 0, 8],
      });
    }
  }
  return boxed(inner);
}

function observationBlock(observation: string): Content {
  return boxed([
    { text: "Interpretation / Observation:", fontSize: 9.5, bold: true, color: BLACK },
    { text: "", margin: [0, 1.5, 0, 0] },
    { text: observation, fontSize: 9, color: GREY, lineHeight: 1.3 },
  ]);
}

function boxed(inner: Content[]): Content {
  return {
    table: { widths: ["*"], body: [[{ stack: inner, border: [true, true, true, true] }]] },
    layout: { hLineColor: () => LINE_GREY, vLineColor: () => LINE_GREY, hLineWidth: () => 0.8, vLineWidth: () => 0.8, paddingLeft: () => 6, paddingRight: () => 6, paddingTop: () => 6, paddingBottom: () => 6 },
    margin: [0, 6, 0, 0],
  };
}

function endOfReport(): Content {
  return { text: "*** End of Report ***", color: MID_GREY, fontSize: 8, italics: true, alignment: "center", margin: [0, 8, 0, 4] };
}

// ═══════════════════════════════════════════════════════════════════════════
// Footer (signatures + lines + page number)
// ═══════════════════════════════════════════════════════════════════════════
function signatureBlock(config: HospitalConfig, assets: Assets): Content | null {
  const techName = cfg(config, "lab_technician_name", "labTechnicianName");
  const techQual = cfg(config, "lab_technician_qualification", "labTechnicianQualification");
  const techReg = cfg(config, "lab_technician_reg_no", "labTechnicianRegNo");
  const pathName = cfg(config, "pathologist_name", "pathologistName");
  const pathQual = cfg(config, "pathologist_qualification", "pathologistQualification");
  const pathReg = cfg(config, "pathologist_reg_no", "pathologistRegNo");

  const hasTech = !!(assets.techSig || techName || techQual);
  const hasPath = !!(assets.pathSig || pathName || pathQual);
  if (!hasTech && !hasPath) return null;

  const col = (sig: string | undefined, name: string, qual: string, reg: string): Content => ({
    width: "*",
    alignment: "center",
    stack: [
      sig
        ? { image: sig, fit: [80, 28], alignment: "center", margin: [0, 0, 0, 1] }
        : { canvas: [{ type: "line", x1: (CONTENT_WIDTH / 2 - 80) / 2, y1: 22, x2: (CONTENT_WIDTH / 2 - 80) / 2 + 80, y2: 22, lineWidth: 0.8, lineColor: LINE_GREY }] },
      ...(name ? [{ text: name, fontSize: 7.5, bold: true, color: BLACK } as Content] : []),
      ...(qual ? [{ text: qual, fontSize: 6.5, color: GREY } as Content] : []),
      ...(reg ? [{ text: "Reg. No.: " + reg, fontSize: 6, color: MID_GREY } as Content] : []),
    ],
  } as unknown as Content);

  return {
    columns: [
      hasTech ? col(assets.techSig, techName, techQual, techReg) : { width: "*", text: "" },
      hasPath ? col(assets.pathSig, pathName, pathQual, pathReg) : { width: "*", text: "" },
    ],
    margin: [0, 0, 0, 3],
  };
}

function footer(config: HospitalConfig, assets: Assets, currentPage: number, pageCount: number): Content {
  const footer1 = cfg(config, "footer_line_1", "footerLine1") || "NOT VALID FOR MEDICO LEGAL PURPOSE";
  const footer2 = cfg(config, "footer_line_2", "footerLine2");
  const footer3 = cfg(config, "footer_line_3", "footerLine3") || "If results are alarming or unexpected, contact the laboratory immediately.";
  const wish = cfg(config, "wish_text", "wishText") || "Wishing you a speedy recovery and good health.";
  const name = cfg(config, "name", "hospital_name");

  const sig = signatureBlock(config, assets);
  const stack: Content[] = [];
  if (sig) stack.push(sig);
  stack.push({ text: wish, fontSize: 7.5, color: GREY, italics: true, alignment: "center" });
  stack.push({ text: "", margin: [0, 1.5, 0, 0] });
  stack.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 0.8, lineColor: LINE_GREY }] });
  stack.push({ text: footer1, color: BLACK, fontSize: 6.5, bold: true, alignment: "center", margin: [0, 3, 0, 0] });
  if (footer2) stack.push({ text: footer2, color: GREY, fontSize: 6.5, alignment: "center", margin: [0, 1, 0, 0] });
  stack.push({ text: footer3, color: MID_GREY, fontSize: 6, alignment: "center", margin: [0, 1, 0, 0] });
  stack.push({
    columns: [
      { text: name, color: MID_GREY, fontSize: 8, width: "*" },
      { text: `Page ${currentPage} of ${pageCount}`, color: MID_GREY, fontSize: 8, alignment: "right", width: "auto" },
    ],
    margin: [0, 2, 0, 0],
  });

  return { stack, margin: [42, 0, 42, 0] };
}

// ═══════════════════════════════════════════════════════════════════════════
// Document
// ═══════════════════════════════════════════════════════════════════════════
export async function buildReportDoc(report: LabReport, config: HospitalConfig, verifyUrl: string): Promise<TDocumentDefinitions> {
  const verificationCode = (report.verificationCode as string) || report.id.slice(-6).toUpperCase();
  const assets: Assets = {
    qr: await QRCode.toDataURL(verifyUrl, { margin: 0, width: 120 }),
    logo: await fetchAsDataUrl(cfg(config, "logo_url", "logoUrl") || undefined),
    techSig: await fetchAsDataUrl(cfg(config, "technician_signature_url", "technicianSignatureUrl") || undefined),
    pathSig: await fetchAsDataUrl(cfg(config, "pathologist_signature_url", "pathologistSignatureUrl") || undefined),
  };

  const content: Content[] = [];

  const renderTest = (testType: string, results: LabParameter[], observation: string | undefined, includeInterp: boolean) => {
    content.push(testTitle(testType));
    content.push(testBanner());
    content.push(...buildResultWidgets(results));
    if (!includeInterp) return;
    const blocks = generateBlocks(testType, results);
    if (blocks && blocks.length) {
      content.push(interpretationBlocksContent(blocks));
    } else if (observation && observation.trim()) {
      content.push(observationBlock(observation));
    }
  };

  if (report.sections?.length) {
    report.sections.forEach((s, i) => {
      renderTest(s.testType, s.results ?? [], s.observation, s.showInterpretation !== false);
      if (i < report.sections!.length - 1) {
        content.push({ text: `--- End of ${s.testType} ---`, color: MID_GREY, fontSize: 8, italics: true, alignment: "center", margin: [0, 6, 0, 4] });
        content.push({ canvas: [{ type: "line", x1: 0, y1: 4, x2: CONTENT_WIDTH, y2: 4, lineWidth: 0.5, lineColor: LINE_GREY }], margin: [0, 0, 0, 6] });
      }
    });
  } else {
    renderTest(report.testType, report.results ?? [], report.observation, report.showInterpretation !== false);
  }
  content.push(endOfReport());

  // Precompute the two header elements once. pdfMake mutates content objects
  // (writing _positions, heights, etc.) during layout, so we must deep-clone
  // them for every page — otherwise page 2+ sees already-processed objects
  // and silently skips them, leaving the patient info box blank on page 2+.
  const headerWidgetDef = headerWidget(config, assets);
  const patientInfoDef = patientInfoGrid(report, assets, verificationCode);

  return {
    pageSize: "A4",
    pageMargins: [42, 175, 42, 120],
    header: () => ({
      stack: [
        JSON.parse(JSON.stringify(headerWidgetDef)) as Content,
        JSON.parse(JSON.stringify(patientInfoDef)) as Content,
      ],
      margin: [42, 32, 42, 0],
    }),
    footer: (currentPage: number, pageCount: number) => footer(config, assets, currentPage, pageCount),
    content,
    defaultStyle: { font: "Roboto" },
  };
}

export async function generateReportBlob(report: LabReport, config: HospitalConfig, verifyUrl: string): Promise<Blob> {
  const def = await buildReportDoc(report, config, verifyUrl);
  return new Promise((resolve) => pdfMake.createPdf(def).getBlob((blob) => resolve(blob)));
}

export async function downloadReportPdf(report: LabReport, config: HospitalConfig, verifyUrl: string): Promise<void> {
  const def = await buildReportDoc(report, config, verifyUrl);
  pdfMake.createPdf(def).download(`${report.patientName || "report"}-${report.id.slice(-6)}.pdf`);
}
