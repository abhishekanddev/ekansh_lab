import type { CyclePhase, LabTestTemplate, TemplateParameter } from "../data/labTestTemplates";
import type { LabParameter } from "./types";
import { resolveRange } from "./labLogic";

/** Builds the initial editable result rows for a test template, resolving
 *  gender/cycle-phase reference ranges (mirrors the Flutter report seed). */
export function buildInitialResults(
  template: LabTestTemplate,
  gender?: string,
  phase?: CyclePhase,
): LabParameter[] {
  return template.parameters.map((p: TemplateParameter) => ({
    parameter: p.name,
    value: "",
    unit: p.unit ?? "",
    range: resolveRange(p, gender, phase),
    section: p.section,
    flag: null,
    inputType: p.inputType ?? "text",
    dropdownOptions: p.dropdownOptions,
    gridRows: p.gridRows,
    gridColumns: p.gridColumns,
    isCalculated: p.isCalculated ?? false,
    isCustom: false,
  }));
}

/** Human-readable value summary from grid data — mirrors gridDataToSummary. */
export function gridSummary(
  gridData: Record<string, Record<string, unknown>>,
  columns: string[],
  isSensitivity = false,
): string {
  if (isSensitivity) {
    return Object.entries(gridData)
      .map(([k, v]) => `${k}: ${v.sensitivity ?? ""}`)
      .join(", ");
  }
  const parts: string[] = [];
  for (const [row, cells] of Object.entries(gridData)) {
    if ("result" in cells) {
      parts.push(`${row}: ${cells.result === true ? "Positive" : "Negative"}`);
      continue;
    }
    let endpoint: string | undefined;
    for (const col of [...columns].reverse()) {
      if (cells[col] === true) {
        endpoint = col;
        break;
      }
    }
    parts.push(`${row}: ${endpoint ?? "Negative"}`);
  }
  return parts.join(", ");
}

/** Distinct ordered sections present in a result list (undefined = ungrouped). */
export function resultSections(results: LabParameter[]): (string | undefined)[] {
  const seen = new Set<string | undefined>();
  const out: (string | undefined)[] = [];
  for (const r of results) {
    if (!seen.has(r.section)) {
      seen.add(r.section);
      out.push(r.section);
    }
  }
  return out;
}

/** Normalize an Indian phone number to its last 10 digits (doc id for patients). */
export function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function genId(prefix = "rpt"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
