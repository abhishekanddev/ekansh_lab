import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import QRCode from "qrcode";
import type { TDocumentDefinitions, Content, TableCell, Column } from "pdfmake/interfaces";
import type { HospitalConfig, LabParameter, LabReport } from "../types";
import { generateBlocks, type InterpretationBlock } from "../interpretationEngine";
import { resultSections } from "../reportBuilder";

// pdfmake vfs wiring (browser)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

const NAVY = "#0f47a1";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

function resultsTable(results: LabParameter[]): Content {
  const sections = resultSections(results);
  const body: TableCell[][] = [];
  const header: TableCell[] = [
    { text: "PARAMETER", style: "th" },
    { text: "VALUE", style: "th", alignment: "right" },
    { text: "UNIT", style: "th" },
    { text: "REFERENCE", style: "th" },
  ];
  body.push(header);

  for (const section of sections) {
    if (section) {
      body.push([{ text: section, colSpan: 4, style: "section", fillColor: "#f6f8fb" }, {}, {}, {}]);
    }
    for (const r of results.filter((x) => x.section === section)) {
      const high = r.flag === "H";
      const low = r.flag === "L";
      const flagged = high || low;
      body.push([
        { text: r.parameter, style: "td" },
        {
          text: r.value + (flagged ? (high ? "  H" : "  L") : ""),
          style: "td",
          alignment: "right",
          bold: flagged,
          color: high ? "#dc2626" : low ? "#1f6feb" : INK,
        },
        { text: r.unit, style: "tdMuted" },
        { text: r.range, style: "tdMuted" },
      ]);
    }
  }

  return {
    table: { headerRows: 1, widths: ["*", "auto", "auto", "auto"], body },
    layout: {
      hLineWidth: (i: number) => (i === 1 ? 0.8 : 0.4),
      vLineWidth: () => 0,
      hLineColor: () => BORDER,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
    margin: [0, 4, 0, 8],
  };
}

function interpretationContent(blocks: InterpretationBlock[]): Content[] {
  return blocks.map((b): Content => {
    if (b.kind === "text") return { text: b.text, bold: b.bold, style: "interp", margin: [0, 2, 0, 4] };
    const body: TableCell[][] = [b.headers.map((h) => ({ text: h, style: "th" }))];
    for (const row of b.rows) body.push(row.map((c) => ({ text: c, style: "td" })));
    return {
      stack: [
        ...(b.title ? [{ text: b.title, bold: true, style: "interp", margin: [0, 4, 0, 2] } as Content] : []),
        {
          table: { headerRows: 1, widths: b.headers.map(() => "*"), body },
          layout: { hLineWidth: () => 0.4, vLineWidth: () => 0.4, hLineColor: () => BORDER, vLineColor: () => BORDER },
          margin: [0, 2, 0, 6],
        },
      ],
    };
  });
}

function patientGrid(report: LabReport): Content {
  const fd = report.formData ?? {};
  const cell = (label: string, value: string): TableCell => ({
    text: [{ text: label + ": ", color: MUTED }, { text: value || "—", color: INK, bold: true }],
    style: "td",
  });
  return {
    table: {
      widths: ["*", "*", "*"],
      body: [
        [cell("Name", report.patientName), cell("Age/Sex", [fd.age, fd.gender].filter(Boolean).join(" / ")), cell("Phone", report.phone ?? "")],
        [cell("Referred by", report.referredBy ?? "Self"), cell("Report ID", report.id.slice(-10)), cell("", "")],
      ],
    },
    layout: "noBorders",
    margin: [0, 6, 0, 8],
  };
}

async function header(config: HospitalConfig, verifyUrl: string): Promise<Content> {
  const qr = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 120 });
  const name = (config.hospital_name || config.name || "Diagnostic Laboratory") as string;
  return {
    columns: [
      {
        width: "*",
        stack: [
          { text: name, style: "labName" },
          ...(config.address ? [{ text: config.address as string, style: "labAddr" }] : []),
          ...(config.reportHeaderSubtitle ? [{ text: config.reportHeaderSubtitle as string, style: "labAddr" }] : []),
        ],
      },
      { width: 56, image: qr, fit: [56, 56] },
    ],
    margin: [0, 0, 0, 4],
  };
}

function footer(config: HospitalConfig): Content {
  const sig = (name?: string, qual?: string, reg?: string, url?: string): Column => ({
    width: "*",
    stack: [
      ...(url ? [{ image: url, fit: [90, 36], margin: [0, 0, 0, 2] } as Content] : [{ text: " ", margin: [0, 0, 0, 18] } as Content]),
      { text: name || "", bold: true, fontSize: 9 },
      ...(qual ? [{ text: qual, fontSize: 8, color: MUTED } as Content] : []),
      ...(reg ? [{ text: "Reg: " + reg, fontSize: 8, color: MUTED } as Content] : []),
    ],
    alignment: "center",
  });
  const lines = [config.footerLine1, config.footerLine2, config.footerLine3].filter(Boolean) as string[];
  return {
    margin: [0, 16, 0, 0],
    stack: [
      {
        columns: [
          sig(config.labTechnicianName, config.labTechnicianQualification, config.labTechnicianRegNo, config.technicianSignatureUrl),
          sig(config.pathologistName, config.pathologistQualification, config.pathologistRegNo, config.pathologistSignatureUrl),
        ],
      },
      ...(lines.length ? [{ text: lines.join("  •  "), alignment: "center", fontSize: 8, color: MUTED, margin: [0, 8, 0, 0] } as Content] : []),
      ...(config.wishText ? [{ text: config.wishText as string, alignment: "center", italics: true, fontSize: 8, color: MUTED, margin: [0, 2, 0, 0] } as Content] : []),
    ],
  };
}

/** Build a pdfmake document definition for a report. */
export async function buildReportDoc(
  report: LabReport,
  config: HospitalConfig,
  verifyUrl: string,
): Promise<TDocumentDefinitions> {
  const head = await header(config, verifyUrl);
  const content: Content[] = [head, { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: NAVY }] }, patientGrid(report)];

  const renderTest = (testType: string, results: LabParameter[], observation?: string) => {
    content.push({ text: testType, style: "testTitle", margin: [0, 6, 0, 2] });
    content.push(resultsTable(results));
    if (observation) {
      content.push({ text: "Interpretation", style: "interpTitle", margin: [0, 4, 0, 2] });
      content.push({ text: observation, style: "interp" });
    }
    const blocks = generateBlocks(testType, results);
    if (blocks) content.push(...interpretationContent(blocks));
  };

  if (report.sections?.length) {
    report.sections.forEach((s) => renderTest(s.testType, s.results ?? [], s.observation));
  } else {
    renderTest(report.testType, report.results ?? [], report.observation);
  }

  return {
    pageSize: "A4",
    pageMargins: [36, 36, 36, 70],
    content,
    footer: () => footer(config) as Content,
    styles: {
      labName: { fontSize: 16, bold: true, color: NAVY },
      labAddr: { fontSize: 8, color: MUTED },
      testTitle: { fontSize: 12, bold: true, color: NAVY },
      th: { fontSize: 8, bold: true, color: MUTED },
      section: { fontSize: 8, bold: true, color: INK },
      td: { fontSize: 9, color: INK },
      tdMuted: { fontSize: 9, color: MUTED },
      interpTitle: { fontSize: 10, bold: true, color: INK },
      interp: { fontSize: 8.5, color: INK, lineHeight: 1.25 },
    },
    defaultStyle: { font: "Roboto" },
  };
}

/** Generate the report PDF as a Blob (client-side). */
export async function generateReportBlob(report: LabReport, config: HospitalConfig, verifyUrl: string): Promise<Blob> {
  const def = await buildReportDoc(report, config, verifyUrl);
  return new Promise((resolve) => {
    pdfMake.createPdf(def).getBlob((blob) => resolve(blob));
  });
}

/** Trigger a browser download of the report PDF. */
export async function downloadReportPdf(report: LabReport, config: HospitalConfig, verifyUrl: string): Promise<void> {
  const def = await buildReportDoc(report, config, verifyUrl);
  pdfMake.createPdf(def).download(`${report.patientName || "report"}-${report.id.slice(-6)}.pdf`);
}
