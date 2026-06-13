import type { CyclePhase, TemplateParameter } from "../data/labTestTemplates";

/**
 * Computes the flag ("H" or "L") based on a value vs a reference range.
 * Mirrors LabParameter.computeFlag in lab_result_model.dart.
 * Returns null if the range is non-numeric or the value is in range.
 */
export function computeFlag(currentValue: string, range: string): "H" | "L" | null {
  if (!range || !currentValue) return null;
  const num = Number(currentValue.trim());
  if (Number.isNaN(num)) return null;

  const dash = range.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (dash) {
    const low = parseFloat(dash[1]);
    const high = parseFloat(dash[2]);
    if (num < low) return "L";
    if (num > high) return "H";
    return null;
  }
  const lt = range.match(/<\s*([\d.]+)/);
  if (lt) {
    const upper = parseFloat(lt[1]);
    return num >= upper ? "H" : null;
  }
  const gt = range.match(/>\s*([\d.]+)/);
  if (gt) {
    const lower = parseFloat(gt[1]);
    return num <= lower ? "L" : null;
  }
  return null;
}

/**
 * Resolves the best-fit reference range for a template parameter given the
 * patient's gender and (for females) menstrual cycle phase.
 * Mirrors TemplateParameter.resolveRange.
 */
export function resolveRange(
  p: TemplateParameter,
  gender?: string,
  phase?: CyclePhase,
): string {
  if (
    p.rangeByCyclePhase &&
    gender === "Female" &&
    phase &&
    phase !== "notApplicable"
  ) {
    const key = phase.charAt(0).toUpperCase() + phase.slice(1);
    const r = p.rangeByCyclePhase[key];
    if (r) return r;
  }
  if (p.rangeByGender && gender) {
    const r = p.rangeByGender[gender];
    if (r) return r;
  }
  return p.normalRange ?? "";
}

export const CYCLE_PHASE_LABELS: Record<CyclePhase, string> = {
  notApplicable: "Not applicable",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
  postmenopausal: "Postmenopausal",
};
