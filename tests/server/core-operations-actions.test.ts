import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(), validateOrganizationPathForActor: vi.fn(),
  assertCoreDocumentAccess: vi.fn(), assertComplianceRecordAccess: vi.fn(), assertProgramAccess: vi.fn(), assertInvoiceAccess: vi.fn(), assertPaymentAccess: vi.fn(),
  documentCreate: vi.fn(), versionCreate: vi.fn(), contextCreate: vi.fn(), complianceCreate: vi.fn(), invoiceCreate: vi.fn(), paymentCreate: vi.fn(), auditCreate: vi.fn(),
  programFindUnique: vi.fn(), userFindFirst: vi.fn(), invoiceFindUnique: vi.fn(), paymentFindFirst: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/organization/service", () => ({ validateOrganizationPathForActor: mocks.validateOrganizationPathForActor }));
vi.mock("@/server/auth/resource-access", () => ({
  assertApplicationAccess: vi.fn(), assertCareerEmployerAccess: vi.fn(), assertCareerOpportunityAccess: vi.fn(), assertComplianceRecordAccess: mocks.assertComplianceRecordAccess, assertCoreDocumentAccess: mocks.assertCoreDocumentAccess,
  assertEmployeeAccess: vi.fn(), assertInstitutionAccess: vi.fn(), assertInvoiceAccess: mocks.assertInvoiceAccess, assertLabsProductAccess: vi.fn(), assertPaymentAccess: mocks.assertPaymentAccess, assertProgramAccess: mocks.assertProgramAccess, assertStudentAccess: vi.fn()
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  employee: { findFirst: vi.fn() }, coreDocument: { update: vi.fn(), findUniqueOrThrow: vi.fn() }, coreDocumentVersion: { findFirst: vi.fn() },
  complianceRecord: { findUniqueOrThrow: vi.fn(), update: vi.fn() }, complianceDocument: { upsert: vi.fn() }, careerEmployer: { findFirstOrThrow: vi.fn() },
  program: { findUnique: mocks.programFindUnique }, user: { findFirst: mocks.userFindFirst }, feeInvoice: { findUnique: mocks.invoiceFindUnique, findUniqueOrThrow: vi.fn(), update: vi.fn() },
  paymentTransaction: { findFirst: mocks.paymentFindFirst }, platformAudit: { create: mocks.auditCreate },
  $transaction: vi.fn(async (input: unknown) => typeof input === "function" ? input({
    coreDocument: { create: mocks.documentCreate }, coreDocumentVersion: { create: mocks.versionCreate, findFirst: vi.fn() }, coreDocumentContextLink: { create: mocks.contextCreate },
    complianceRecord: { create: mocks.complianceCreate }, feeInvoice: { create: mocks.invoiceCreate, update: vi.fn() }, paymentTransaction: { create: mocks.paymentCreate, findUnique: vi.fn(), update: vi.fn() }, platformAudit: { create: mocks.auditCreate }
  }) : input)
} }));

import { createCoreDocumentAction, createFinanceInvoiceAction, recordFinancePaymentAction, updateFinanceInvoiceStatusAction, verifyFinancePaymentAction } from "@/actions/core-operations";

const orgId = "00000000-0000-4000-8000-000000000001";
const programId = "00000000-0000-4000-8000-000000000002";
const invoiceId = "00000000-0000-4000-8000-000000000003";
const paymentId = "00000000-0000-4000-8000-000000000004";
const actor = (role = "Director") => ({ id: "actor-1", roles: [{ role: { name: role } }], employeeProfile: { institutionId: orgId } });
function form(values: Record<string, string>) { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data; }

describe("Core operations mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.getCurrentUser.mockResolvedValue(actor()); mocks.validateOrganizationPathForActor.mockResolvedValue(undefined);
    mocks.assertProgramAccess.mockResolvedValue(undefined); mocks.assertInvoiceAccess.mockResolvedValue(undefined); mocks.assertPaymentAccess.mockResolvedValue(undefined);
    mocks.documentCreate.mockResolvedValue({ id: "document-1" }); mocks.versionCreate.mockResolvedValue({ id: "version-1", version: 1 }); mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
    mocks.programFindUnique.mockResolvedValue({ id: programId, institutionId: orgId, divisionId: null, campusId: null, departmentId: null, division: null, campus: null, department: null });
    mocks.userFindFirst.mockResolvedValue({ id: "customer-1" }); mocks.invoiceCreate.mockResolvedValue({ id: invoiceId, invoiceNo: "INV-1", currency: "INR", total: 1000 });
    mocks.invoiceFindUnique.mockResolvedValue({ id: invoiceId, status: "ISSUED", total: 1000, studentId: null, transactions: [] }); mocks.paymentFindFirst.mockResolvedValue(null); mocks.paymentCreate.mockResolvedValue({ id: paymentId, provider: "MANUAL", amount: 500 });
  });

  it("creates document metadata, version, and audit atomically", async () => {
    const result = await createCoreDocumentAction({ ok: false, message: "" }, form({ institutionId: orgId, code: "POL-1", displayName: "Policy", category: "POLICY", accessPolicy: "PRIVATE", originalFilename: "policy.pdf", mimeType: "application/pdf", storageProvider: "object-store", storageKey: "private/policy.pdf" }));
    expect(result.ok).toBe(true); expect(mocks.documentCreate).toHaveBeenCalled(); expect(mocks.versionCreate).toHaveBeenCalled(); expect(mocks.auditCreate).toHaveBeenCalled();
  });

  it("denies document creation without permission", async () => {
    mocks.getCurrentUser.mockResolvedValue(actor("Student"));
    await expect(createCoreDocumentAction({ ok: false, message: "" }, form({ institutionId: orgId }))).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("creates a scoped draft invoice from an authorized program", async () => {
    const result = await createFinanceInvoiceAction({ ok: false, message: "" }, form({ programId, invoiceNo: "INV-1", currency: "INR", subtotal: "1000", discount: "0", tax: "0" }));
    expect(result.ok).toBe(true); expect(mocks.invoiceCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ institutionId: orgId, status: "DRAFT", total: 1000 }) }));
  });

  it("rejects non-positive invoice totals", async () => {
    const result = await createFinanceInvoiceAction({ ok: false, message: "" }, form({ programId, invoiceNo: "INV-1", currency: "INR", subtotal: "1000", discount: "1000", tax: "0" }));
    expect(result.message).toContain("greater than zero"); expect(mocks.invoiceCreate).not.toHaveBeenCalled();
  });

  it("does not let a browser manually assert paid status", async () => {
    const result = await updateFinanceInvoiceStatusAction({ ok: false, message: "" }, form({ invoiceId, status: "PAID" }));
    expect(result.message).toContain("derived from verified payments"); expect(mocks.assertInvoiceAccess).not.toHaveBeenCalled();
  });

  it("rejects payment amounts above the scoped invoice balance", async () => {
    const result = await recordFinancePaymentAction({ ok: false, message: "" }, form({ invoiceId, provider: "MANUAL", amount: "1001", providerRef: "BANK-1" }));
    expect(result.message).toContain("exceeds"); expect(mocks.paymentCreate).not.toHaveBeenCalled();
  });

  it("records payments as initiated rather than successful", async () => {
    const result = await recordFinancePaymentAction({ ok: false, message: "" }, form({ invoiceId, provider: "MANUAL", amount: "500", providerRef: "BANK-1" }));
    expect(result.ok).toBe(true); expect(mocks.paymentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "INITIATED", recordedById: "actor-1" }) }));
  });

  it("blocks crafted payment IDs before verification", async () => {
    mocks.assertPaymentAccess.mockRejectedValue(new AuthorizationError("outside finance scope"));
    await expect(verifyFinancePaymentAction({ ok: false, message: "" }, form({ paymentId, decision: "VERIFIED" }))).rejects.toThrow("outside finance scope");
  });
});
