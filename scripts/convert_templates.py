"""One-shot converter: Dart lab_test_templates.dart -> TS labTestTemplates.ts.

The Dart data is declarative (named-constructor object literals), so it maps
almost 1:1 to JS object literals. We replace the constructor calls with braces
(balanced-paren scan that ignores parens inside strings) and emit a typed TS
array. Run once; the generated file is the source of truth thereafter.
"""
import re, sys

SRC = r"D:\Freelance\EP\ekansh_portal\lib\features\lab_dashboard\models\lab_test_templates.dart"
OUT = r"D:\Freelance\EP\ekansh_lims\src\data\labTestTemplates.ts"

text = open(SRC, encoding="utf-8").read()

# Slice the list body: from `all = [` to its matching `];`
m = re.search(r"static final List<LabTestTemplate>\s+all\s*=\s*\[", text)
assert m, "could not find templates list"
start = m.end() - 1  # position of '['

# balanced bracket scan for the list, ignoring strings
def scan(s, i, openc, closec):
    depth = 0
    in_str = False
    quote = ""
    while i < len(s):
        c = s[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                in_str = False
        else:
            if c in ("'", '"'):
                in_str = True
                quote = c
            elif c == openc:
                depth += 1
            elif c == closec:
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    raise ValueError("unbalanced")

end = scan(text, start, "[", "]")
body = text[start : end + 1]

# Replace constructor calls `Name(` ... `)` with `{` ... `}`.
# Do it iteratively: find `TemplateParameter(` or `LabTestTemplate(`, find the
# matching paren via scan, and swap.
def replace_ctor(s, name):
    out = []
    i = 0
    needle = name + "("
    while True:
        j = s.find(needle, i)
        if j == -1:
            out.append(s[i:])
            break
        out.append(s[i:j])
        paren_open = j + len(name)  # index of '('
        close = scan(s, paren_open, "(", ")")
        inner = s[paren_open + 1 : close]
        out.append("{" + inner + "}")
        i = close + 1
    return "".join(out)

# strip `const ` first
body = body.replace("const ", "")
body = replace_ctor(body, "TemplateParameter")
body = replace_ctor(body, "LabTestTemplate")

# enum -> string literal
body = re.sub(r"ParameterInputType\.(\w+)", r'"\1"', body)

# Dart `//` line comments are valid in TS too; keep them.

ts = '''// AUTO-GENERATED from ekansh_portal lab_test_templates.dart — do not hand-edit.
// Regenerate via scripts/convert_templates.py if the Flutter templates change.

export type ParameterInputType =
  | "text"
  | "numeric"
  | "dropdown"
  | "grid"
  | "sensitivityGrid";

export type CyclePhase =
  | "notApplicable"
  | "follicular"
  | "ovulatory"
  | "luteal"
  | "postmenopausal";

export interface TemplateParameter {
  name: string;
  unit?: string;
  normalRange?: string;
  section?: string;
  inputType?: ParameterInputType;
  dropdownOptions?: string[];
  gridRows?: string[];
  gridColumns?: string[];
  gridPositiveThreshold?: string;
  gridCellOptions?: string[];
  rangeByGender?: Record<string, string>;
  rangeByCyclePhase?: Record<string, string>;
  isCalculated?: boolean;
}

export interface LabTestTemplate {
  testName: string;
  category: string;
  parameters: TemplateParameter[];
}

export const LAB_TEST_TEMPLATES: LabTestTemplate[] = ''' + body + ''';

/** Distinct section names in order of appearance for a template. */
export function templateSections(t: LabTestTemplate): (string | undefined)[] {
  const seen = new Set<string | undefined>();
  const result: (string | undefined)[] = [];
  for (const p of t.parameters) {
    if (!seen.has(p.section)) {
      seen.add(p.section);
      result.push(p.section);
    }
  }
  return result;
}

/** Distinct categories across all templates. */
export const TEST_CATEGORIES: string[] = Array.from(
  new Set(LAB_TEST_TEMPLATES.map((t) => t.category)),
);
'''

open(OUT, "w", encoding="utf-8").write(ts)
print(f"Wrote {OUT}: {len(LAB := re.findall(r'testName:', body))} templates")
