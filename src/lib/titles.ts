// Patient name titles (salutations) shown before the name on reports.
// Kept in sync with the Flutter portal (lib/features/lab_dashboard/utils/patient_title.dart).

export const PATIENT_TITLES = ["Mr.", "Mrs.", "Ms.", "Master", "Baby"] as const;
export type PatientTitle = (typeof PATIENT_TITLES)[number];

/** Gender implied by a title. Returns "" for titles with no implied gender (Baby). */
export function genderForTitle(title: string): string {
  switch (title) {
    case "Mr.":
    case "Master":
      return "Male";
    case "Mrs.":
    case "Ms.":
      return "Female";
    default:
      return "";
  }
}

/** Default title for a gender — used to auto-fill when the title is blank or mismatched. */
export function titleForGender(gender: string): string {
  switch (gender) {
    case "Male":
      return "Mr.";
    case "Female":
      return "Mrs.";
    default:
      return "";
  }
}

/** True when the title's implied gender conflicts with the given gender. */
export function titleMismatchesGender(title: string, gender: string): boolean {
  const g = genderForTitle(title);
  return g !== "" && gender !== "" && g !== gender;
}

/** Combine a title and name for display, e.g. "Mr. Rahul Sharma". */
export function withTitle(title: string | undefined, name: string): string {
  const t = (title ?? "").trim();
  return t ? `${t} ${name}`.trim() : name;
}
