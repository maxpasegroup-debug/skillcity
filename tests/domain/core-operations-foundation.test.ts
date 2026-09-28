import { describe, expect, it } from "vitest";
import { complianceRecordSchema, coreDocumentSchema, financeInvoiceSchema } from "@/features/core-operations/schemas";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { calculateInvoiceTotal, canTransitionComplianceStatus, canTransitionInvoiceStatus, effectiveComplianceStatus, normalizeRecordCode, outstandingInvoiceAmount, validCurrency } from "@/lib/core-operations/policies";
import { complianceRecordScopeWhere, coreDocumentScopeWhere, feeInvoiceScopeWhere, paymentTransactionScopeWhere } from "@/server/auth/scoping";
import { coreDocumentVersionPresentationSelect } from "@/server/core-operations/queries";

const uuid = (suffix: string) => `00000000-0000-4000-8000-0000000000${suffix}`;
const role = (name: string) => [{ role: { name } }];

describe("AIRA Core Documents, Compliance, and Finance", () => {
  it("normalizes stable operational record codes", () => {
    expect(normalizeRecordCode(" policy / 2026-01 ")).toBe("POLICY-2026-01");
  });

  it("validates provider-neutral document metadata", () => {
    const result = coreDocumentSchema.safeParse({ institutionId: uuid("01"), code: "POL-1", displayName: "Privacy Policy", category: "POLICY", accessPolicy: "ORGANIZATION", originalFilename: "policy.pdf", mimeType: "application/pdf", storageProvider: "object-storage", storageKey: "private/policy.pdf" });
    expect(result.success).toBe(true);
  });

  it("requires context type and context ID together", () => {
    const result = coreDocumentSchema.safeParse({ institutionId: uuid("01"), code: "POL-1", displayName: "Privacy Policy", category: "POLICY", accessPolicy: "AUTHORIZED_CONTEXT", originalFilename: "policy.pdf", mimeType: "application/pdf", storageProvider: "object-storage", storageKey: "private/policy.pdf", contextType: "EMPLOYEE" });
    expect(result.success).toBe(false);
  });

  it("never includes storage keys in document presentation", () => {
    expect(Object.keys(coreDocumentVersionPresentationSelect)).not.toContain("storageKey");
  });

  it("scopes document records to organization assignments", () => {
    const manager = { id: "records-1", roles: role("Records Manager"), employeeProfile: { institutionId: "org-1" } };
    expect(JSON.stringify(coreDocumentScopeWhere(manager, PERMISSIONS.DOCUMENTS_READ))).toContain("org-1");
    expect(JSON.stringify(coreDocumentScopeWhere(manager, PERMISSIONS.DOCUMENTS_READ))).not.toContain("org-2");
  });

  it("allows owner-only document predicates without broad organization access", () => {
    const owner = { id: "owner-1", roles: [{ role: { name: "Custom", permissions: [{ scope: "OWN" as const, permission: { key: PERMISSIONS.DOCUMENTS_READ, active: true } }] } }] };
    expect(JSON.stringify(coreDocumentScopeWhere(owner, PERMISSIONS.DOCUMENTS_READ))).toContain("owner-1");
  });

  it("validates compliance dates and subject references", () => {
    expect(complianceRecordSchema.safeParse({ institutionId: uuid("01"), code: "KYC-1", title: "Partner KYC", subjectType: "EMPLOYER", subjectId: uuid("02"), effectiveAt: "2026-01-01", expiresAt: "2027-01-01" }).success).toBe(true);
    expect(complianceRecordSchema.safeParse({ institutionId: uuid("01"), code: "KYC-1", title: "Partner KYC", subjectType: "EMPLOYER" }).success).toBe(false);
  });

  it("enforces controlled compliance transitions", () => {
    expect(canTransitionComplianceStatus("PENDING", "ACTIVE")).toBe(true);
    expect(canTransitionComplianceStatus("ARCHIVED", "ACTIVE")).toBe(false);
  });

  it("derives expiry without rewriting historical status", () => {
    expect(effectiveComplianceStatus("ACTIVE", new Date("2026-01-01"), new Date("2026-09-28"))).toBe("EXPIRED");
    expect(effectiveComplianceStatus("WAIVED", new Date("2026-01-01"), new Date("2026-09-28"))).toBe("WAIVED");
  });

  it("scopes compliance to the assigned organization", () => {
    const manager = { id: "compliance-1", roles: role("Compliance Manager"), employeeProfile: { institutionId: "org-1" } };
    expect(JSON.stringify(complianceRecordScopeWhere(manager, PERMISSIONS.COMPLIANCE_READ))).toContain("org-1");
  });

  it("calculates invoice totals without guessing tax", () => {
    expect(calculateInvoiceTotal({ subtotal: 10000, discount: 1000, tax: 900 })).toBe(9900);
  });

  it("accepts only ISO-style three-letter currency codes", () => {
    expect(validCurrency("INR")).toBe(true);
    expect(validCurrency("inr")).toBe(false);
    expect(financeInvoiceSchema.safeParse({ programId: uuid("01"), invoiceNo: "INV-1", currency: "INR", subtotal: 1000, discount: 0, tax: 0 }).success).toBe(true);
  });

  it("calculates outstanding value from verified payments only", () => {
    expect(outstandingInvoiceAmount({ total: 1000, transactions: [{ amount: 400, status: "SUCCESS" }, { amount: 500, status: "INITIATED" }] })).toBe(600);
  });

  it("enforces invoice lifecycle transitions", () => {
    expect(canTransitionInvoiceStatus("DRAFT", "ISSUED")).toBe(true);
    expect(canTransitionInvoiceStatus("CANCELLED", "PAID")).toBe(false);
  });

  it("inherits payment scope through its invoice", () => {
    const manager = { id: "finance-1", roles: role("Finance Manager"), employeeProfile: { institutionId: "org-1" } };
    expect(JSON.stringify(feeInvoiceScopeWhere(manager, PERMISSIONS.FINANCE_READ))).toContain("org-1");
    expect(JSON.stringify(paymentTransactionScopeWhere(manager, PERMISSIONS.FINANCE_READ))).toContain("invoice");
  });

  it("does not grant sensitive core domains to unrelated roles", () => {
    for (const name of ["Student", "Trainer", "Academic Advisor", "Career Participant"]) {
      const user = { id: name, roles: role(name) };
      expect(hasPermission(user, PERMISSIONS.DOCUMENTS_READ)).toBe(false);
      expect(hasPermission(user, PERMISSIONS.COMPLIANCE_READ)).toBe(false);
      expect(hasPermission(user, PERMISSIONS.FINANCE_READ)).toBe(false);
    }
  });

  it("keeps wallet and commission permissions outside Finance foundation", () => {
    expect(Object.values(PERMISSIONS)).not.toContain("wallet.manage");
    expect(Object.values(PERMISSIONS)).not.toContain("commission.settle");
  });
});
