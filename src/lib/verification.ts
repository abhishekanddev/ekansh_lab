import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { requireDb } from "./db";

/**
 * Public report verification codes — web port of the Flutter
 * `VerificationCodeService`. Generates an `EP-XXXXXX` code (no confusable
 * 0/O/1/I/L characters) and registers a top-level `report_verifications/{code}`
 * doc that maps the code to a hospital + report, so codes created on web verify
 * exactly like those created on mobile.
 */

const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  const buf = new Uint32Array(6);
  crypto.getRandomValues(buf);
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += CHARS[buf[i] % CHARS.length];
  return `EP-${suffix}`;
}

/** Create a unique verification entry and return its `EP-XXXXXX` code. */
export async function createVerificationEntry(params: {
  hospitalId: string;
  reportId: string;
  hospitalName: string;
  patientName: string;
  testType: string;
}): Promise<string> {
  const db = requireDb();
  let code = randomCode();
  // Avoid collisions (extremely rare, but matches Flutter's do/while).
  for (let attempts = 0; attempts < 5; attempts++) {
    const existing = await getDoc(doc(db, "report_verifications", code));
    if (!existing.exists()) break;
    code = randomCode();
  }
  await setDoc(doc(db, "report_verifications", code), {
    hospitalId: params.hospitalId,
    reportId: params.reportId,
    hospitalName: params.hospitalName,
    patientName: params.patientName,
    testType: params.testType,
    createdAt: serverTimestamp(),
  });
  return code;
}
