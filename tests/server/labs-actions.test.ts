import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(), validateOrganizationPathForActor: vi.fn(), assertEmployeeAccess: vi.fn(), assertLabsProductAccess: vi.fn(),
  employeeFindFirst: vi.fn(), productFindUnique: vi.fn(), productCreate: vi.fn(), productUpdate: vi.fn(),
  assignmentFindFirst: vi.fn(), assignmentFindMany: vi.fn(), assignmentCreate: vi.fn(), assignmentUpdate: vi.fn(), auditCreate: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/organization/service", () => ({ validateOrganizationPathForActor: mocks.validateOrganizationPathForActor }));
vi.mock("@/server/auth/resource-access", () => ({ assertEmployeeAccess: mocks.assertEmployeeAccess, assertLabsProductAccess: mocks.assertLabsProductAccess }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  employee: { findFirst: mocks.employeeFindFirst }, labsProduct: { findUnique: mocks.productFindUnique, update: mocks.productUpdate },
  labsProductAssignment: { findFirst: mocks.assignmentFindFirst, update: mocks.assignmentUpdate }, platformAudit: { create: mocks.auditCreate },
  $transaction: vi.fn(async (input: unknown) => typeof input === "function" ? input({ labsProduct: { create: mocks.productCreate }, labsProductAssignment: { findMany: mocks.assignmentFindMany, create: mocks.assignmentCreate, update: mocks.assignmentUpdate }, platformAudit: { create: mocks.auditCreate } }) : input)
} }));

import { addLabsContributorAction, createLabsProductAction, replaceLabsOwnerAction, updateLabsProductAction } from "@/actions/labs";

const institutionId = "00000000-0000-4000-8000-000000000001";
const divisionId = "00000000-0000-4000-8000-000000000002";
const employeeId = "00000000-0000-4000-8000-000000000003";
const productId = "00000000-0000-4000-8000-000000000004";

function actor(role = "Director") { return { id: "actor-1", roles: [{ role: { name: role } }], accessScopes: [], employeeProfile: { id: "actor-employee", institutionId } }; }
function productForm() { const form = new FormData(); for (const [key, value] of Object.entries({ name: "Core Platform", code: "core-platform", description: "Central operating product for AIRA.", type: "PLATFORM", lifecycle: "IDEA", institutionId, divisionId, ownerId: employeeId })) form.set(key, value); return form; }
function currentProduct() { return { id: productId, code: "core-platform", name: "Core Platform", description: "Central operating product for AIRA.", type: "PLATFORM", lifecycle: "IDEA", institutionId, divisionId, districtId: null, campusId: null, departmentId: null, archivedAt: null }; }

describe("AIRA Labs mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.getCurrentUser.mockResolvedValue(actor()); mocks.validateOrganizationPathForActor.mockResolvedValue(undefined); mocks.assertEmployeeAccess.mockResolvedValue(undefined); mocks.assertLabsProductAccess.mockResolvedValue(undefined); mocks.employeeFindFirst.mockResolvedValue({ id: employeeId, institutionId, divisionId, organizationAssignments: [], user: { id: "owner-user", status: "ACTIVE" } }); mocks.productCreate.mockResolvedValue(currentProduct()); mocks.productFindUnique.mockResolvedValue(currentProduct()); mocks.productUpdate.mockResolvedValue(currentProduct()); mocks.assignmentFindFirst.mockResolvedValue(null); mocks.assignmentFindMany.mockResolvedValue([]); mocks.assignmentCreate.mockResolvedValue({ id: "assignment-1" }); mocks.assignmentUpdate.mockResolvedValue({ id: "assignment-1" }); mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("creates a scoped product, primary owner, and audit atomically", async () => {
    const result = await createLabsProductAction({ ok: false, message: "" }, productForm());
    expect(result).toMatchObject({ ok: true, code: "core-platform" });
    expect(mocks.validateOrganizationPathForActor).toHaveBeenCalled();
    expect(mocks.productCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ code: "core-platform", createdById: "actor-1" }) }));
    expect(mocks.assignmentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ role: "OWNER", employeeId }) }));
  });

  it("denies creation without labs.create", async () => {
    mocks.getCurrentUser.mockResolvedValue(actor("Student"));
    await expect(createLabsProductAction({ ok: false, message: "" }, productForm())).rejects.toBeInstanceOf(AuthorizationError);
    expect(mocks.productCreate).not.toHaveBeenCalled();
  });

  it("denies an invalid or unauthorized organization path", async () => {
    mocks.validateOrganizationPathForActor.mockRejectedValue(new AuthorizationError("outside organization scope"));
    await expect(createLabsProductAction({ ok: false, message: "" }, productForm())).rejects.toThrow("outside organization scope");
  });

  it("reports duplicate product codes", async () => {
    mocks.productCreate.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "6.19.3" }));
    const result = await createLabsProductAction({ ok: false, message: "" }, productForm());
    expect(result).toEqual({ ok: false, message: "Product code is already in use." });
  });

  it("rejects an inactive owner Employee", async () => {
    mocks.employeeFindFirst.mockResolvedValue(null);
    await expect(createLabsProductAction({ ok: false, message: "" }, productForm())).rejects.toThrow("active Employee");
  });

  it("rejects owner organization mismatch", async () => {
    mocks.employeeFindFirst.mockResolvedValue({ id: employeeId, institutionId: "other-org", organizationAssignments: [], user: { id: "owner-user" } });
    await expect(createLabsProductAction({ ok: false, message: "" }, productForm())).rejects.toThrow("does not cover");
  });

  it("blocks crafted product IDs through centralized product access", async () => {
    mocks.assertLabsProductAccess.mockRejectedValue(new AuthorizationError("Labs product was not found in the authorized organization scope"));
    const form = new FormData(); form.set("productId", productId); form.set("employeeId", employeeId);
    await expect(replaceLabsOwnerAction({ ok: false, message: "" }, form)).rejects.toThrow("authorized organization scope");
  });

  it("replaces product ownership while ending prior history", async () => {
    mocks.assignmentFindMany.mockResolvedValue([{ id: "old-owner", startsAt: new Date("2026-09-01") }]);
    const form = new FormData(); form.set("productId", productId); form.set("employeeId", employeeId);
    const result = await replaceLabsOwnerAction({ ok: false, message: "" }, form);
    expect(result.ok).toBe(true);
    expect(mocks.assignmentUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "old-owner" }, data: expect.objectContaining({ status: "INACTIVE" }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "LABS_PRODUCT_OWNER_REPLACED" }) }));
  });

  it("rejects a duplicate overlapping contributor", async () => {
    mocks.assignmentFindFirst.mockResolvedValue({ id: "existing" });
    const form = new FormData(); for (const [key, value] of Object.entries({ productId, employeeId, responsibility: "Developer", startsAt: "2026-09-28T09:00" })) form.set(key, value);
    const result = await addLabsContributorAction({ ok: false, message: "" }, form);
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining("overlapping") });
  });

  it("updates lifecycle with an audit while preserving stable code and scope", async () => {
    const form = productForm(); form.delete("ownerId"); form.set("productId", productId); form.set("lifecycle", "LIVE");
    const result = await updateLabsProductAction({ ok: false, message: "" }, form);
    expect(result.ok).toBe(true);
    expect(mocks.productUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ lifecycle: "LIVE" }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "LABS_PRODUCT_STATUS_CHANGED" }) }));
  });

  it("rejects a crafted product-code change", async () => {
    const form = productForm(); form.delete("ownerId"); form.set("productId", productId); form.set("code", "renamed-product");
    const result = await updateLabsProductAction({ ok: false, message: "" }, form);
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining("stable") });
  });

  it("requires labs.manage to archive a product", async () => {
    mocks.getCurrentUser.mockResolvedValue(actor("HOD"));
    const form = productForm(); form.delete("ownerId"); form.set("productId", productId); form.set("lifecycle", "ARCHIVED");
    await expect(updateLabsProductAction({ ok: false, message: "" }, form)).rejects.toThrow("labs.manage");
    expect(mocks.productUpdate).not.toHaveBeenCalled();
  });
});
