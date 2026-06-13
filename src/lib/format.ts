import type { Timestamp } from "firebase/firestore";

/** Coerce a Firestore Timestamp | Date | millis into a Date (or null). */
export function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object" && v !== null && "toDate" in v) {
    try {
      return (v as Timestamp).toDate();
    } catch {
      return null;
    }
  }
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const DATETIME_FMT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

export function fmtDate(v: unknown): string {
  const d = toDate(v);
  return d ? DATE_FMT.format(d) : "—";
}

export function fmtDateTime(v: unknown): string {
  const d = toDate(v);
  return d ? DATETIME_FMT.format(d) : "—";
}

export function fmtMoney(n?: number | null): string {
  if (n == null) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function isToday(v: unknown): boolean {
  const d = toDate(v);
  if (!d) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
