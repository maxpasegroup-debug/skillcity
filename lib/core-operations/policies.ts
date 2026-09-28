export const CORE_DOCUMENT_CATEGORIES = ["IDENTITY", "CONTRACT", "AGREEMENT", "CERTIFICATE", "INVOICE", "RECEIPT", "APPLICATION_RECORD", "PORTFOLIO", "COMPLIANCE", "POLICY", "OTHER"] as const;
export const DOCUMENT_ACCESS_POLICIES = ["PRIVATE", "OWNER", "ORGANIZATION", "AUTHORIZED_CONTEXT"] as const;
export const DOCUMENT_CONTEXT_TYPES = ["EMPLOYEE", "STUDENT", "APPLICATION", "INVOICE", "COMPLIANCE", "ORGANIZATION", "CAREER_OPPORTUNITY", "LABS_PRODUCT", "PROGRAM", "OTHER"] as const;
export const COMPLIANCE_SUBJECT_TYPES = ["ORGANIZATION", "EMPLOYEE", "STUDENT", "EMPLOYER", "PROGRAM", "DOCUMENT", "OTHER"] as const;
export const COMPLIANCE_STATUSES = ["PENDING", "ACTIVE", "EXPIRED", "REJECTED", "WAIVED", "ARCHIVED"] as const;
export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "CANCELLED"] as const;

export function normalizeRecordCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const complianceTransitions: Record<(typeof COMPLIANCE_STATUSES)[number], readonly (typeof COMPLIANCE_STATUSES)[number][]> = {
  PENDING: ["ACTIVE", "REJECTED", "WAIVED", "ARCHIVED"],
  ACTIVE: ["EXPIRED", "WAIVED", "ARCHIVED"],
  EXPIRED: ["ACTIVE", "WAIVED", "ARCHIVED"],
  REJECTED: ["PENDING", "ARCHIVED"],
  WAIVED: ["PENDING", "ARCHIVED"],
  ARCHIVED: []
};

export function canTransitionComplianceStatus(from: (typeof COMPLIANCE_STATUSES)[number], to: (typeof COMPLIANCE_STATUSES)[number]) {
  return from === to || complianceTransitions[from].includes(to);
}

export function effectiveComplianceStatus(status: (typeof COMPLIANCE_STATUSES)[number], expiresAt: Date | null, now = new Date()) {
  return status === "ACTIVE" && expiresAt && expiresAt <= now ? "EXPIRED" as const : status;
}

const invoiceTransitions: Record<(typeof INVOICE_STATUSES)[number], readonly (typeof INVOICE_STATUSES)[number][]> = {
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "CANCELLED"],
  PARTIALLY_PAID: ["PAID", "OVERDUE", "VOID"],
  PAID: ["VOID"],
  OVERDUE: ["PARTIALLY_PAID", "PAID", "VOID"],
  VOID: [],
  CANCELLED: []
};

export function canTransitionInvoiceStatus(from: (typeof INVOICE_STATUSES)[number], to: (typeof INVOICE_STATUSES)[number]) {
  return from === to || invoiceTransitions[from].includes(to);
}

export function calculateInvoiceTotal(input: { subtotal: number; discount: number; scholarship?: number; tax: number }) {
  return input.subtotal - input.discount - (input.scholarship ?? 0) + input.tax;
}

export function validCurrency(value: string) {
  return /^[A-Z]{3}$/.test(value);
}

export function outstandingInvoiceAmount(invoice: { total: number; transactions: Array<{ amount: number; status: string }> }) {
  const paid = invoice.transactions.filter((payment) => payment.status === "SUCCESS").reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, invoice.total - paid);
}
