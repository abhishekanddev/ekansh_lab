import type { LabParameter } from "./types";

/** Structured interpretation block — mirrors InterpretationBlock in Flutter. */
export type InterpretationBlock =
  | { kind: "text"; text: string; bold?: boolean }
  | { kind: "table"; title?: string; headers: string[]; rows: string[][] };

const text = (t: string, bold = false): InterpretationBlock => ({ kind: "text", text: t, bold });
const table = (headers: string[], rows: string[][], title?: string): InterpretationBlock => ({
  kind: "table",
  headers,
  rows,
  title,
});

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function valueFor(results: LabParameter[], keyword: string): string {
  const p = results.find((r) => r.parameter.toLowerCase().includes(keyword));
  return (p?.value ?? "").toLowerCase().trim();
}

function isPositive(value: string): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  const num = Number(v);
  if (!Number.isNaN(num) && v.trim() !== "") return num >= 10;
  return ["positive", "pos", "reactive", "detected", "present"].includes(v);
}

/* ── Narrative (text) interpretation ──────────────────────────────────────── */
export function generateInterpretation(testType: string, results: LabParameter[]): string | null {
  const t = testType.toLowerCase();
  if (t.includes("malaria")) return malaria(results);
  if (t.includes("typhi")) return typhiDot(results);
  if (t.includes("dengue")) return dengue(results);
  if (t.includes("hiv") || t.includes("hepatitis") || t.includes("hbsag") || t.includes("hcv")) return hepatitis(results);
  if (t.includes("widal")) return widal(results);
  if (t.includes("culture") && t.includes("sensitivity")) return cultureSensitivity(results);
  if (t.includes("chikungunya")) return chikungunya(results);
  if (t.includes("scrub typhus")) return scrubTyphus(results);
  if (t.includes("pregnancy")) return pregnancy(results);
  if (t.includes("vdrl") || t.includes("rpr")) return vdrl(results);
  if (t.includes("leptospira")) return leptospira(results);
  return null;
}

/* ── Structured blocks ────────────────────────────────────────────────────── */
export function generateBlocks(testType: string, _results: LabParameter[]): InterpretationBlock[] | null {
  const t = testType.toLowerCase();
  if (t.includes("kidney") || t.includes("kft")) return kftBlocks();
  if (t.includes("lipid")) return lipidBlocks();
  if (t.includes("blood sugar") || t.includes("glucose tolerance")) return sugarBlocks();
  if (t.includes("hba1c")) return hba1cBlocks();
  if (t.includes("liver") || t.includes("lft")) return lftBlocks();
  if (t.includes("thyroid") || t.includes("tft")) return thyroidBlocks();
  if (t.includes("cbc") || t.includes("complete blood count")) return cbcBlocks();
  return null;
}

function kftBlocks(): InterpretationBlock[] {
  return [
    text("Creatinine is a nitrogenous waste product formed in muscle from creatine phosphate. It is freely filtered at the glomerulus, and is not reabsorbed and only slightly secreted by the renal tubules. Serum creatinine is therefore a good indicator of glomerular filtration rate (GFR).", true),
    table(
      ["Causes of Increased Serum Creatinine Level", "Causes of Decreased Serum Creatinine Level"],
      [
        ["1. Pre-renal, renal, and post-renal dysfunction", "1. Pregnancy"],
        ["2. Large amount of meat consumed in diet", "2. Increasing age (reduction in muscle mass)"],
        ["3. Active acromegaly and gigantism", ""],
      ],
    ),
    text("GFR is measured to (i) detect suspected incipient renal impairment, (ii) carefully monitor patients with established renal impairment, and (iii) plan dosing regimen of potentially toxic drugs cleared by the kidneys."),
    text("BUN/creatinine ratio is to discriminate pre-renal and post-renal causes from renal causes of uremia. A ratio of >20:1 suggests pre-renal or post-renal failure, whereas a ratio <10:1 points to intrinsic renal disease."),
  ];
}

function lipidBlocks(): InterpretationBlock[] {
  return [
    text("Abnormalities of lipids are associated with increased risk of atherosclerotic cardiovascular disease (ASCVD). The usual pattern of dyslipidemia in type 2 DM is elevated triglycerides, low HDL-C, and an increase in the proportion of small dense LDL particles."),
    text("Newer treatment goals based on Lipid Association of India 2020:", true),
    table(
      ["Risk Category", "Goal LDL (mg/dL)", "Goal Non-HDL (mg/dL)", "Consider LDL (mg/dL)", "Consider Non-HDL (mg/dL)"],
      [
        ["Extreme Risk A", "< 50", "< 80", ">= 50", ">= 80"],
        ["Very High Risk", "< 50", "< 80", ">= 50", ">= 80"],
        ["High Risk", "< 70", "< 100", ">= 70", ">= 100"],
        ["Moderate Risk", "< 100", "< 130", ">= 100", ">= 130"],
        ["Low Risk", "< 100", "< 130", ">= 130", ">= 160"],
      ],
    ),
  ];
}

function sugarBlocks(): InterpretationBlock[] {
  return [
    text("Clinical Notes:", true),
    text("Elevated glucose levels (hyperglycemia) are most often indicative of Diabetes Mellitus. Lowered glucose levels (hypoglycemia) can occur due to excess insulin, prolonged fasting, or severe liver disease."),
    table(
      ["Fasting Glucose (mg/dL)", "2 hrs PP Glucose (mg/dL)", "Diagnosis"],
      [
        ["< 100", "< 140", "Normal"],
        ["100 to 125", "140 to 199", "Pre Diabetes"],
        [">= 126", ">= 200", "Diabetes"],
      ],
    ),
  ];
}

function hba1cBlocks(): InterpretationBlock[] {
  return [
    table(
      ["Reference Group", "Non-DM >= 18 yrs", "At Risk", "Diagnosing DM", "Goal for DM"],
      [["HbA1c in %", "4.0 - 5.6", "5.7 - 6.4", ">= 6.5", "< 7.0"]],
      "Interpretation as per ADA Guidelines:",
    ),
    text("Clinical significance:", true),
    text("Hemoglobin A1c (HbA1c) level reflects the mean glucose concentration over the previous 8 to 12 weeks. It is used for both diagnosis and monitoring of long-term glycemic control in diabetes."),
    table(
      ["HbA1c (%) NSGP", "mmol/mol IFCC", "eAG mg/dl"],
      [
        ["6.0", "42", "126"],
        ["7.0", "53", "154"],
        ["8.0", "64", "183"],
        ["9.0", "75", "212"],
        ["10.0", "86", "240"],
        ["11.0", "97", "269"],
        ["12.0", "108", "298"],
      ],
    ),
  ];
}

function lftBlocks(): InterpretationBlock[] {
  return [
    text("Clinical Notes:", true),
    text("Liver function tests are used to evaluate various functions of the liver. Elevated AST and ALT usually indicate hepatocellular injury. Elevated ALP and GGT suggest cholestasis or biliary obstruction."),
    text("Bilirubin levels (Total, Direct, Indirect) help in classifying jaundice into pre-hepatic, hepatic, or post-hepatic causes. Total protein and albumin levels reflect the synthetic function of the liver."),
  ];
}

function thyroidBlocks(): InterpretationBlock[] {
  return [
    text("Clinical Notes:", true),
    text("Thyroid function tests help assess the functioning of the thyroid gland. TSH is typically the most sensitive marker for thyroid status."),
    table(
      ["Condition", "TSH Level", "Free T4 / Total T4 Level"],
      [
        ["Primary Hypothyroidism", "High", "Low"],
        ["Subclinical Hypothyroidism", "High", "Normal"],
        ["Primary Hyperthyroidism", "Low", "High"],
        ["Subclinical Hyperthyroidism", "Low", "Normal"],
      ],
    ),
    text("TSH levels are subject to circadian variation, reaching peak between 2-4 a.m. and minimum between 6-10 p.m. (variation ~50%), so time of day influences measured serum TSH."),
    table(
      ["Trimester", "TSH Range (mIU/L)"],
      [
        ["First trimester", "0.10 - 2.5"],
        ["Second trimester", "0.20 - 3.0"],
        ["Third trimester", "0.30 - 3.5"],
      ],
      "Bio Ref Range for TSH in pregnant females (mIU/L) — As per American Thyroid Association",
    ),
  ];
}

function cbcBlocks(): InterpretationBlock[] {
  return [
    text("Clinical Notes:", true),
    text("A Complete Blood Count (CBC) provides detailed information about three major types of cells in the blood: red blood cells, white blood cells, and platelets. It is a broad screening test to determine general health status."),
    text("Abnormalities in red blood cell counts and indices can indicate different types of anemia. White blood cell differentials help identify infection, inflammation, or immune system disorders. Platelet counts are crucial for evaluating bleeding or clotting disorders."),
  ];
}

/* ── Narrative generators ─────────────────────────────────────────────────── */
function malaria(r: LabParameter[]): string {
  const vivaxPos = isPositive(valueFor(r, "vivax"));
  const falciPos = isPositive(valueFor(r, "falciparum"));
  if (vivaxPos && falciPos)
    return "- Both Plasmodium Vivax and Plasmodium Falciparum antigens detected in blood.\n- This indicates a mixed malarial infection.\n- Immediate clinical evaluation and treatment are recommended.";
  if (vivaxPos)
    return "- Plasmodium Vivax antigen detected in the blood.\n- This may indicate an active infection with P. Vivax (Benign Tertian Malaria).\n- Clinical correlation and appropriate antimalarial therapy are advised.";
  if (falciPos)
    return "- Plasmodium Falciparum antigen detected in the blood.\n- This may indicate an active infection with P. Falciparum (Malignant Tertian Malaria).\n- Immediate medical attention is recommended as P. Falciparum can cause severe malaria.";
  return "- No malarial antigen (P. Vivax or P. Falciparum) detected in the blood.\n- Active malarial infection is not indicated by this test.\n- If symptoms persist, repeat testing or peripheral smear examination is advised.";
}

function typhiDot(r: LabParameter[]): string {
  const iggPos = isPositive(valueFor(r, "igg"));
  const igmPos = isPositive(valueFor(r, "igm"));
  const refNote = "\n\nReference Range:\n- IgG: Positive >= 10 AU/ml, Negative < 10 AU/ml\n- IgM: Positive >= 10 AU/ml, Negative < 10 AU/ml";
  if (iggPos && igmPos)
    return `- Both IgG and IgM antibodies against Salmonella Typhi are detected.\n- Positive IgG indicates a past or recent infection.\n- Positive IgM indicates an early or current active infection.\n- Clinical correlation and appropriate antibiotic therapy are recommended.${refNote}`;
  if (iggPos)
    return `- Typhi Dot IgG is Positive.\n- Indicates a past or recent infection with Salmonella Typhi.\n- IgM is Negative, suggesting the acute phase may have resolved.${refNote}`;
  if (igmPos)
    return `- Typhi Dot IgM is Positive.\n- Indicates an early or current active infection (Typhoid Fever).\n- Immediate clinical evaluation and antibiotic therapy are strongly advised.${refNote}`;
  return `- Both Typhi Dot IgG and IgM are Negative.\n- Indicates the absence of Salmonella Typhi infection based on this test.\n- If Typhoid is suspected, blood culture and repeat serology are recommended.${refNote}`;
}

function dengue(r: LabParameter[]): string {
  const ns1 = isPositive(valueFor(r, "ns1"));
  const igm = isPositive(valueFor(r, "igm"));
  const igg = isPositive(valueFor(r, "igg"));
  if (ns1 && igm && igg) return "- Dengue NS1, IgM, and IgG are all Positive.\n- Suggests acute secondary Dengue infection.\n- Immediate clinical management is advised.";
  if (ns1) return "- Dengue NS1 Antigen is Positive.\n- Indicates an acute or early Dengue virus infection.\n- Monitor platelet count and hematocrit closely.";
  if (igm && igg) return "- Both Dengue IgM and IgG are Positive.\n- Indicates a late primary or secondary Dengue infection.\n- Clinical correlation is advised.";
  if (igm) return "- Dengue IgM is Positive.\n- Indicates a recent or active Dengue infection.\n- Clinical correlation and monitoring are advised.";
  if (igg) return "- Dengue IgG is Positive.\n- Indicates a past Dengue infection (immune status).\n- Usually not associated with acute infection unless IgM or NS1 is also positive.";
  return "- Dengue NS1, IgM, and IgG are Negative.\n- No evidence of current Dengue virus infection.\n- If symptoms persist, repeat testing or alternative diagnoses should be considered.";
}

function hepatitis(r: LabParameter[]): string {
  const hiv = valueFor(r, "hiv");
  const hbsag = valueFor(r, "hbsag");
  const hcv = valueFor(r, "hcv");
  const lines: string[] = [];
  if (isPositive(hiv)) lines.push("- HIV 1 & 2 Antibody is Reactive.\n- Indicative of HIV infection. Confirmatory testing (Western Blot / HIV RNA PCR) is strongly recommended.");
  else if (hiv) lines.push("- HIV 1 & 2 Antibody is Non-Reactive.");
  if (isPositive(hbsag)) lines.push("- HBsAg is Reactive.\n- Indicates an active Hepatitis B infection (acute or chronic).\n- Further virological and hepatic profile evaluation is recommended.");
  else if (hbsag) lines.push("- HBsAg is Non-Reactive.");
  if (isPositive(hcv)) lines.push("- Anti-HCV is Reactive.\n- Indicates exposure to Hepatitis C virus.\n- HCV RNA testing is recommended to confirm active infection.");
  else if (hcv) lines.push("- Anti-HCV is Non-Reactive.");
  if (lines.length === 0) return "- All tested markers are Non-Reactive.\n- No serological evidence of HIV, Hepatitis B, or Hepatitis C infection based on this test.";
  return lines.join("\n");
}

function widal(r: LabParameter[]): string {
  const titerOrder = ["1:20", "1:40", "1:80", "1:160", "1:320", "1:640", "1:1280"];
  const isSignificant = (titer?: string | null): boolean => {
    if (!titer || titer === "Negative") return false;
    const ti = titerOrder.indexOf(titer);
    const th = titerOrder.indexOf("1:160");
    return ti >= 0 && th >= 0 && ti >= th;
  };
  const endpointTiter = (cells: Record<string, unknown>, cols: string[]): string | null => {
    let endpoint: string | null = null;
    for (const col of cols) if (cells[col] === true) endpoint = col;
    return endpoint;
  };

  const gridParam = r.find((p) => p.inputType === "grid");
  if (gridParam?.gridData) {
    const gd = gridParam.gridData;
    const cols = gridParam.gridColumns ?? titerOrder;
    const isSlide = Object.values(gd).some((v) => "result" in (v as object));
    if (isSlide) {
      const typhi = (gd["S. Typhi O"]?.result === true) || (gd["S. Typhi H"]?.result === true);
      return typhi
        ? "- Widal test (Slide Method) shows POSITIVE agglutination.\n- Slide method is qualitative only. A positive result suggests possible typhoid infection.\n- Confirm with Tube Agglutination test for titre determination and clinical correlation."
        : "- Widal test (Slide Method): All antigens show NEGATIVE agglutination.\n- Active typhoid infection is unlikely based on this result.\n- Clinical correlation is advised if typhoid is suspected.";
    }
    const oTiter = endpointTiter(gd["S. Typhi O"] ?? {}, cols);
    const hTiter = endpointTiter(gd["S. Typhi H"] ?? {}, cols);
    const oSig = isSignificant(oTiter);
    const hSig = isSignificant(hTiter);
    let s: string;
    if (oSig && hSig) s = `- Both S. Typhi O titre (${oTiter}) and H titre (${hTiter}) are significantly elevated.\n- This is strongly suggestive of active typhoid fever.`;
    else if (oSig) s = `- S. Typhi O titre (${oTiter}) is significantly elevated (>= 1:160), indicating likely active typhoid infection.\n- Raised O antigen titre with low H titre is more diagnostic of active disease.`;
    else if (hSig) s = `- S. Typhi H titre (${hTiter}) is elevated (>= 1:160) with low O titre.\n- High H titre with low O titre may suggest past infection or prior immunization rather than active disease.`;
    else s = "- All agglutination titres are below the diagnostic threshold (1:160).\n- Active typhoid infection is unlikely based on this serological test.";
    s += "\n- Note: A 4-fold rise in titres in paired sera (taken 5-7 days apart) is more diagnostically significant than a single result.";
    s += "\n- Clinical correlation is always required for diagnosis.";
    return s;
  }

  let oTiter: string | undefined, hTiter: string | undefined;
  for (const p of r) {
    const name = p.parameter.toLowerCase();
    const val = (p.value ?? "").trim();
    if (name.includes("typhi o") && val) oTiter = val;
    if (name.includes("typhi h") && val) hTiter = val;
  }
  const oSig = isSignificant(oTiter);
  const hSig = isSignificant(hTiter);
  if (oSig && hSig) return `- Both S. Typhi O (${oTiter}) and H (${hTiter}) titres are significantly elevated.\n- Strongly suggestive of active typhoid fever.\n- Clinical correlation and antibiotic treatment are recommended.`;
  if (oSig) return `- S. Typhi O titre (${oTiter}) is significantly elevated (>= 1:160).\n- Suggests likely active typhoid infection. Clinical correlation is advised.`;
  if (hSig) return `- S. Typhi H titre (${hTiter}) is elevated. High H with low O titre may indicate past infection or immunization.\n- Active infection should be confirmed clinically.`;
  return "- All Widal titres are within normal limits (< 1:80).\n- Active typhoid infection is unlikely based on serology.\n- A 4-fold rise in titres in paired sera is more diagnostically significant.";
}

function cultureSensitivity(r: LabParameter[]): string {
  const organism = (r.find((p) => p.parameter === "Isolated Organism")?.value ?? "").trim();
  const sens = r.find((p) => p.inputType === "sensitivityGrid");
  if (!organism || organism.toLowerCase() === "no growth")
    return "- Culture Report: No significant bacterial growth after incubation.\n- Antibiotic therapy may be reconsidered based on clinical presentation.\n- Repeat culture if infection is strongly suspected.";
  const lines = [`- Isolated Organism: ${organism}`];
  if (sens?.gridData) {
    const entries = Object.entries(sens.gridData);
    const pick = (s: string) => entries.filter(([, v]) => (v as Record<string, unknown>).sensitivity === s).map(([k]) => k);
    const S = pick("S"), I = pick("I"), R = pick("R");
    if (S.length) lines.push(`- Sensitive to: ${S.join(", ")}`);
    if (I.length) lines.push(`- Intermediate: ${I.join(", ")}`);
    if (R.length) lines.push(`- Resistant to: ${R.join(", ")}`);
  }
  lines.push("- Antibiotic therapy should be guided by sensitivity results and clinical assessment.\n- Consult with the treating physician for appropriate antimicrobial selection.");
  return lines.join("\n");
}

function chikungunya(r: LabParameter[]): string {
  return isPositive(valueFor(r, "igm"))
    ? "- Chikungunya IgM is Positive.\n- Indicates an acute or recent Chikungunya virus infection.\n- Clinical correlation with joint pain and fever is advised."
    : "- Chikungunya IgM is Negative.\n- No serological evidence of recent Chikungunya infection.";
}

function scrubTyphus(r: LabParameter[]): string {
  return isPositive(valueFor(r, "igm"))
    ? "- Scrub Typhus IgM is Positive.\n- Indicates an acute or recent infection with Orientia tsutsugamushi.\n- Appropriate antibiotic therapy (e.g., Doxycycline) is recommended."
    : "- Scrub Typhus IgM is Negative.\n- No evidence of recent Scrub Typhus infection.";
}

function pregnancy(r: LabParameter[]): string {
  return isPositive(valueFor(r, "hcg"))
    ? "- Urine hCG is Positive.\n- Indicates pregnancy. Clinical correlation and obstetric follow-up are advised."
    : "- Urine hCG is Negative.\n- Does not indicate pregnancy at this time. If early pregnancy is still suspected, repeat after a few days or perform serum Beta-hCG.";
}

function vdrl(r: LabParameter[]): string {
  const marker = valueFor(r, "vdrl") || valueFor(r, "rpr");
  return isPositive(marker)
    ? "- VDRL / RPR is Reactive.\n- Indicates possible Syphilis infection.\n- Confirmation with a specific treponemal test (e.g., TPHA or FTA-ABS) is highly recommended."
    : "- VDRL / RPR is Non-Reactive.\n- No serological evidence of Syphilis infection based on this test.";
}

function leptospira(r: LabParameter[]): string {
  return isPositive(valueFor(r, "igm"))
    ? "- Leptospira IgM is Positive.\n- Indicates acute or recent leptospirosis.\n- Clinical correlation and appropriate antibiotic therapy are advised."
    : "- Leptospira IgM is Negative.\n- No serological evidence of recent Leptospira infection.";
}
