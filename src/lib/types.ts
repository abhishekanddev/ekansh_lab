import type { ParameterInputType } from "../data/labTestTemplates";

/** A single lab result parameter — mirrors LabParameter in Flutter. */
export interface LabParameter {
  parameter: string;
  value: string;
  unit: string;
  range: string;
  section?: string;
  flag?: string | null;
  inputType?: ParameterInputType | string | null;
  dropdownOptions?: string[];
  gridData?: Record<string, Record<string, unknown>>;
  gridRows?: string[];
  gridColumns?: string[];
  isCalculated?: boolean;
  isCustom?: boolean;
}

/** Patient/report metadata embedded in a report's formData. */
export interface ReportFormData {
  age?: string;
  gender?: string;
  phone?: string;
  [k: string]: unknown;
}

/** A completed lab report (hospitals/{hid}/lab_reports/{id}). */
export interface LabReport {
  id: string;
  patientName: string;
  phone?: string;
  testType: string;
  parameterCount: number;
  pdfUrl?: string;
  machineImageUrl?: string;
  verificationCode?: string;
  observation?: string;
  price?: number;
  referredBy?: string;
  referredById?: string;
  formData?: ReportFormData;
  results?: LabParameter[];
  /** Single-test reports only — when false, the PDF omits the interpretation block. */
  showInterpretation?: boolean;
  /** Multi-test batch reports carry sections instead of a single results list. */
  batchId?: string;
  sections?: { testType: string; results: LabParameter[]; observation?: string; showInterpretation?: boolean }[];
  invoiceId?: string;
  createdAt?: unknown; // Firestore Timestamp | serverTimestamp
}

/** Lab patient registry (doc id = phone). */
export interface LabPatient {
  id: string;
  hospitalId?: string;
  name: string;
  age?: string;
  gender?: string;
  phone: string;
  uhid?: string;
  lastVisit?: unknown;
  totalVisits?: number;
}

export interface Referrer {
  id: string;
  name: string;
  specialization?: string;
  phone?: string;
  registrationNumber?: string;
  isSelf?: boolean;
}

export interface TestCatalogItem {
  id: string;
  testName: string;
  category: string;
  price: number;
  isActive: boolean;
}

export interface InvoiceLineItem {
  particulars: string;
  date?: unknown;
  rate: number;
  quantity: number;
  discountPercent?: number;
  taxPercent?: number;
  amount: number;
}

export interface InvoiceModel {
  id: string;
  invoiceNumber: string;
  receiptNumber?: string;
  patientName?: string;
  patientUhid?: string;
  age?: string;
  gender?: string;
  phone?: string;
  date?: unknown;
  lineItems: InvoiceLineItem[];
  billAmount: number;
  discountTotal: number;
  taxTotal: number;
  finalBillAmount: number;
  paidAmount: number;
  paymentMode?: string;
  amountInWords?: string;
  reportId?: string;
  pdfUrl?: string;
}

/** Lab branding / report config — lives on the hospitals/{hid} doc. */
export interface HospitalConfig {
  name?: string;
  hospital_name?: string;
  address?: string;
  logoUrl?: string;
  headerImageUrl?: string;
  footerImageUrl?: string;
  pathologistName?: string;
  pathologistQualification?: string;
  pathologistRegNo?: string;
  labTechnicianName?: string;
  labTechnicianQualification?: string;
  labTechnicianRegNo?: string;
  pathologistSignatureUrl?: string;
  technicianSignatureUrl?: string;
  footerLine1?: string;
  footerLine2?: string;
  footerLine3?: string;
  wishText?: string;
  reportHeaderSubtitle?: string;
  reportDisclaimer?: string;
  registrationNumber?: string;
  websiteUrl?: string;
  reportLayoutMode?: "digital" | "image" | "preprinted";
  preprintedTopMm?: number;
  preprintedBottomMm?: number;
  preprintedLeftMm?: number;
  preprintedRightMm?: number;
  [k: string]: unknown;
}

export interface LabStaffPermissions {
  canViewAnalytics?: boolean;
  canEditPrices?: boolean;
  canDeleteReports?: boolean;
  canEditLabInfo?: boolean;
  canSeedCatalog?: boolean;
}

export interface LabActivityLog {
  id: string;
  action: string;
  performed_by?: string;
  performed_by_uid?: string;
  target_name?: string;
  timestamp?: unknown;
  metadata?: Record<string, unknown>;
}
