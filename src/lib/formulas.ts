import type { LabParameter } from "./types";
import { computeFlag } from "./labLogic";

/**
 * Pre-calculated (derived) lab values — web port of the Flutter
 * `FormulaEvaluator` + `TemplateService._defaultFormulas()`.
 *
 * Certain parameters (e.g. MCV, LDL, Globulin) are computed automatically
 * from other parameters in the same test rather than entered by hand. The
 * formulas, variable names and rounding here mirror the Flutter app exactly
 * so reports calculated on web match those calculated on mobile.
 */

export interface FormulaDefinition {
  /** Parameter name whose value this formula computes. */
  targetParam: string;
  /** Arithmetic expression; variable names use underscores for spaces. */
  expression: string;
  /** Decimal places for the result. */
  precision: number;
  /** Human-readable formula shown in the ƒx tooltip. */
  displayFormula: string;
  /** Explanation shown in the ƒx tooltip. */
  description: string;
  /** Parameter names this formula reads from. */
  inputParams: string[];
}

/** Parameter name → expression variable name (Flutter: spaces → underscores). */
export function toVarName(paramName: string): string {
  return paramName.replace(/ /g, "_");
}

export const DEFAULT_FORMULAS: Record<string, FormulaDefinition[]> = {
  "CBC (Complete Blood Count)": [
    {
      targetParam: "Basophils",
      expression: "100 - Neutrophils - Lymphocytes - Eosinophils - Monocytes",
      precision: 0,
      displayFormula: "Basophils % = 100 − (Neutrophils + Lymphocytes + Eosinophils + Monocytes)",
      description: "Basophil percentage — calculated as the remainder of the differential leucocyte count.",
      inputParams: ["Neutrophils", "Lymphocytes", "Eosinophils", "Monocytes"],
    },
    {
      targetParam: "MCV",
      expression: "(Hct / RBC_Count) * 10",
      precision: 1,
      displayFormula: "MCV = (Hct / RBC) × 10",
      description: "Mean Corpuscular Volume — average volume of a red blood cell in femtoliters (fL).",
      inputParams: ["Hct", "RBC Count"],
    },
    {
      targetParam: "MCH",
      expression: "(Hemoglobin / RBC_Count) * 10",
      precision: 1,
      displayFormula: "MCH = (Hgb / RBC) × 10",
      description: "Mean Corpuscular Hemoglobin — average mass of hemoglobin per red blood cell in picograms (pg).",
      inputParams: ["Hemoglobin", "RBC Count"],
    },
    {
      targetParam: "MCHC",
      expression: "(Hemoglobin / Hct) * 100",
      precision: 1,
      displayFormula: "MCHC = (Hgb / Hct) × 100",
      description: "Mean Corpuscular Hemoglobin Concentration — average concentration of hemoglobin in red blood cells in g/dL.",
      inputParams: ["Hemoglobin", "Hct"],
    },
    {
      targetParam: "Absolute Neutrophils",
      expression: "(Neutrophils * Total_Leucocyte_Count) / 100",
      precision: 0,
      displayFormula: "Absolute Neutrophils = (Neutrophils % × TLC) ÷ 100",
      description: "Absolute Neutrophil Count — derived from the differential percentage and total leucocyte count.",
      inputParams: ["Neutrophils", "Total Leucocyte Count"],
    },
    {
      targetParam: "Absolute Lymphocytes",
      expression: "(Lymphocytes * Total_Leucocyte_Count) / 100",
      precision: 0,
      displayFormula: "Absolute Lymphocytes = (Lymphocytes % × TLC) ÷ 100",
      description: "Absolute Lymphocyte Count — derived from the differential percentage and total leucocyte count.",
      inputParams: ["Lymphocytes", "Total Leucocyte Count"],
    },
    {
      targetParam: "Absolute Eosinophils",
      expression: "(Eosinophils * Total_Leucocyte_Count) / 100",
      precision: 0,
      displayFormula: "Absolute Eosinophils = (Eosinophils % × TLC) ÷ 100",
      description: "Absolute Eosinophil Count — derived from the differential percentage and total leucocyte count.",
      inputParams: ["Eosinophils", "Total Leucocyte Count"],
    },
    {
      targetParam: "Absolute Monocytes",
      expression: "(Monocytes * Total_Leucocyte_Count) / 100",
      precision: 0,
      displayFormula: "Absolute Monocytes = (Monocytes % × TLC) ÷ 100",
      description: "Absolute Monocyte Count — derived from the differential percentage and total leucocyte count.",
      inputParams: ["Monocytes", "Total Leucocyte Count"],
    },
    {
      targetParam: "Absolute Basophils",
      expression: "(Basophils * Total_Leucocyte_Count) / 100",
      precision: 0,
      displayFormula: "Absolute Basophils = (Basophils % × TLC) ÷ 100",
      description: "Absolute Basophil Count — derived from the differential percentage and total leucocyte count.",
      inputParams: ["Basophils", "Total Leucocyte Count"],
    },
  ],
  "Liver Function Test (LFT)": [
    {
      targetParam: "Indirect Bilirubin",
      expression: "Total_Bilirubin - Direct_Bilirubin",
      precision: 2,
      displayFormula: "Indirect Bilirubin = Total Bilirubin − Direct Bilirubin",
      description: "Unconjugated bilirubin — calculated by subtracting direct (conjugated) from total bilirubin.",
      inputParams: ["Total Bilirubin", "Direct Bilirubin"],
    },
    {
      targetParam: "SGOT/SGPT Ratio",
      expression: "SGOT / SGPT",
      precision: 2,
      displayFormula: "SGOT/SGPT Ratio = SGOT ÷ SGPT",
      description: "Ratio of AST to ALT — used to assess liver disease pattern.",
      inputParams: ["SGOT", "SGPT"],
    },
    {
      targetParam: "Globulin",
      expression: "Total_Proteins - Albumin",
      precision: 2,
      displayFormula: "Globulin = Total Proteins − Albumin",
      description: "Calculated by subtracting albumin from total proteins.",
      inputParams: ["Total Proteins", "Albumin"],
    },
    {
      targetParam: "A : G Ratio",
      expression: "Albumin / Globulin",
      precision: 2,
      displayFormula: "A:G Ratio = Albumin ÷ Globulin",
      description: "Albumin to Globulin ratio — a marker of nutritional status and liver/kidney function.",
      inputParams: ["Albumin", "Globulin"],
    },
  ],
  "Kidney Function Test (KFT)": [
    {
      targetParam: "BUN/Creatinine Ratio",
      expression: "(Blood_Urea * 0.467) / Serum_Creatinine",
      precision: 1,
      displayFormula: "BUN/Creatinine Ratio = (Blood Urea × 0.467) ÷ Serum Creatinine",
      description: "BUN estimated as 46.7% of Blood Urea; ratio used to differentiate pre-renal, renal, and post-renal causes of uremia.",
      inputParams: ["Blood Urea", "Serum Creatinine"],
    },
  ],
  "Lipid Profile": [
    {
      targetParam: "VLDL Cholesterol",
      expression: "Triglycerides / 5",
      precision: 2,
      displayFormula: "VLDL = Triglycerides ÷ 5",
      description: "VLDL Cholesterol estimated as one-fifth of Triglycerides (valid when TG < 400 mg/dL).",
      inputParams: ["Triglycerides"],
    },
    {
      targetParam: "LDL Cholesterol",
      expression: "Total_Cholesterol - HDL_Cholesterol - (Triglycerides / 5)",
      precision: 2,
      displayFormula: "LDL = Total Cholesterol − HDL − (Triglycerides / 5)",
      description: "LDL Cholesterol calculated using the Friedewald formula.",
      inputParams: ["Total Cholesterol", "HDL Cholesterol", "Triglycerides"],
    },
    {
      targetParam: "LDL/HDL Ratio",
      expression: "LDL_Cholesterol / HDL_Cholesterol",
      precision: 2,
      displayFormula: "LDL/HDL Ratio = LDL ÷ HDL",
      description: "Ratio of LDL to HDL Cholesterol — a marker of cardiovascular risk.",
      inputParams: ["LDL Cholesterol", "HDL Cholesterol"],
    },
    {
      targetParam: "Total Cholesterol/HDL Ratio",
      expression: "Total_Cholesterol / HDL_Cholesterol",
      precision: 2,
      displayFormula: "TC/HDL Ratio = Total Cholesterol ÷ HDL",
      description: "Ratio of Total Cholesterol to HDL — a marker of cardiovascular risk.",
      inputParams: ["Total Cholesterol", "HDL Cholesterol"],
    },
  ],
};

/** Returns the formula list for a test, or empty array. */
export function formulasForTest(testType?: string | null): FormulaDefinition[] {
  if (!testType) return [];
  return DEFAULT_FORMULAS[testType] ?? [];
}

/** Look up the formula that computes a given parameter, if any. */
export function formulaForParam(testType: string | null | undefined, paramName: string): FormulaDefinition | null {
  return formulasForTest(testType).find((f) => f.targetParam.toLowerCase() === paramName.toLowerCase()) ?? null;
}

/* ── Safe arithmetic evaluator (+ - * / and parentheses) ────────────────────
 * Replaces the Flutter `math_expressions` dependency. Only supports the
 * operators used by the formulas above; no functions, no exponents. */

type Token = { t: "num" | "op" | "lp" | "rp" | "var"; v: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === " ") { i++; continue; }
    if (c === "(") { tokens.push({ t: "lp", v: c }); i++; continue; }
    if (c === ")") { tokens.push({ t: "rp", v: c }); i++; continue; }
    if ("+-*/".includes(c)) { tokens.push({ t: "op", v: c }); i++; continue; }
    if (/[0-9.]/.test(c)) {
      let n = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) { n += expr[i]; i++; }
      tokens.push({ t: "num", v: n });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let id = "";
      while (i < expr.length && /[A-Za-z0-9_]/.test(expr[i])) { id += expr[i]; i++; }
      tokens.push({ t: "var", v: id });
      continue;
    }
    throw new Error(`Unexpected character '${c}' in expression`);
  }
  return tokens;
}

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

/** Shunting-yard → RPN, then evaluate. Returns NaN on any problem. */
function evalExpression(expr: string, vars: Record<string, number>): number {
  let tokens: Token[];
  try {
    tokens = tokenize(expr);
  } catch {
    return NaN;
  }
  const output: Token[] = [];
  const ops: Token[] = [];

  // Handle unary minus by tracking expectation of an operand.
  let prev: Token | null = null;
  for (const tok of tokens) {
    if (tok.t === "op" && tok.v === "-" && (prev === null || prev.t === "op" || prev.t === "lp")) {
      // unary minus → push 0 before it so "0 - x" yields negation
      output.push({ t: "num", v: "0" });
    }
    if (tok.t === "num" || tok.t === "var") {
      output.push(tok);
    } else if (tok.t === "op") {
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.t === "op" && PREC[top.v] >= PREC[tok.v]) output.push(ops.pop()!);
        else break;
      }
      ops.push(tok);
    } else if (tok.t === "lp") {
      ops.push(tok);
    } else if (tok.t === "rp") {
      while (ops.length && ops[ops.length - 1].t !== "lp") output.push(ops.pop()!);
      if (!ops.length) return NaN;
      ops.pop(); // discard lp
    }
    prev = tok;
  }
  while (ops.length) {
    const op = ops.pop()!;
    if (op.t === "lp" || op.t === "rp") return NaN;
    output.push(op);
  }

  const stack: number[] = [];
  for (const tok of output) {
    if (tok.t === "num") {
      stack.push(parseFloat(tok.v));
    } else if (tok.t === "var") {
      const val = vars[tok.v];
      if (val === undefined || Number.isNaN(val)) return NaN;
      stack.push(val);
    } else if (tok.t === "op") {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return NaN;
      switch (tok.v) {
        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;
        case "/": stack.push(a / b); break;
      }
    }
  }
  return stack.length === 1 ? stack[0] : NaN;
}

/**
 * Evaluate one formula given current parameter values (by parameter name).
 * Returns the formatted result string, or null when any input is missing,
 * non-numeric, or the result is not finite — mirrors the Flutter behaviour.
 */
export function evaluateFormula(formula: FormulaDefinition, paramValues: Record<string, string>): string | null {
  const vars: Record<string, number> = {};
  for (const input of formula.inputParams) {
    const raw = (paramValues[input] ?? "").trim();
    if (raw === "") return null;
    const num = Number(raw);
    if (!Number.isFinite(num)) return null;
    vars[toVarName(input)] = num;
  }
  const result = evalExpression(formula.expression, vars);
  if (!Number.isFinite(result)) return null;
  return result.toFixed(formula.precision);
}

/**
 * Apply every formula for a test to a results array, filling calculated
 * parameters in dependency order (later formulas can use earlier results,
 * e.g. LDL → LDL/HDL Ratio). Returns a new array; calculated targets are
 * flagged `isCalculated` and have their H/L flag recomputed. When inputs are
 * incomplete the calculated field is cleared so it never shows a stale value.
 */
export function applyFormulas(testType: string | null | undefined, results: LabParameter[]): LabParameter[] {
  const formulas = formulasForTest(testType);
  if (formulas.length === 0) return results;

  const next = results.map((r) => ({ ...r }));
  const indexByName = new Map<string, number>();
  next.forEach((r, i) => indexByName.set(r.parameter, i));

  // Snapshot of current values, updated as we compute downstream targets.
  const paramValues: Record<string, string> = {};
  for (const r of next) paramValues[r.parameter] = (r.value ?? "").trim();

  for (const formula of formulas) {
    const idx = indexByName.get(formula.targetParam);
    if (idx === undefined) continue;

    const target = next[idx];
    target.isCalculated = true;

    const value = evaluateFormula(formula, paramValues);
    const resolved = value ?? "";
    target.value = resolved;
    target.flag = resolved ? computeFlag(resolved, target.range) : null;
    paramValues[formula.targetParam] = resolved;
  }
  return next;
}
