import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  validateOrganizationPathForActor: vi.fn(),
  assertEmployeeAccess: vi.fn(),
  designationFindFirst: vi.fn(),
  userFindFirst: vi.fn(),
  employeeFindUnique: vi.fn(),
  employeeFindFirst: vi.fn(),
  employeeFindMany: vi.fn(),
  employeeCreate: vi.fn(),
  employeeUpdate: vi.fn(),
  auditCreate: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/organization/service", () => ({ validateOrganizationPathForActor: mocks.validateOrganizationPathForActor }));
vi.mock("@/server/auth/resource-access", () => ({ assertEmployeeAccess: mocks.assertEmployeeAccess }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    designation: { findFirst: mocks.designationFindFirst },
    user: { findFirst: mocks.userFindFirst },
    employee: { findUnique: mocks.employeeFindUnique, findFirst: mocks.employeeFindFirst, findMany: mocks.employeeFindMany },
    $transaction: vi.fn(async (input: unknown) => typeof input === "function" ? input({ employee: { create: mocks.employeeCreate, update: mocks.employeeUpdate }, platformAudit: { create: mocks.auditCreate } }) : input)
  }
}));

import { createEmployeeAction, updateEmployeeAction } from "@/actions/employees";

const employeeId = "00000000-0000-4000-8000-000000000001";
const designationId = "00000000-0000-4000-8000-000000000002";
const organizationId = "00000000-0000-4000-8000-000000000003";

function actor(role = "HR Manager") {
  return { id: "actor-1", roles: [{ role: { name: role } }], accessScopes: [], employeeProfile: { institutionId: organizationId } };
}

function employeeForm(extra: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ userEmail: "employee@aira.test", employeeCode: "AIRA-001", designationId, institutionId: organizationId, employmentType: "FULL_TIME", status: "ACTIVE", ...extra })) form.set(key, value);
  return form;
}

describe("employee mutation authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(actor());
    mocks.designationFindFirst.mockResolvedValue({ id: designationId, name: "Academic Advisor", active: true });
    mocks.userFindFirst.mockResolvedValue({ id: "user-1", employeeProfile: null });
    mocks.employeeCreate.mockResolvedValue({ id: employeeId });
    mocks.employeeUpdate.mockResolvedValue({ id: employeeId });
  });

  it("creates one Employee linked to an existing User with a normalized code", async () => {
    const result = await createEmployeeAction({ ok: false, message: "" }, employeeForm());
    expect(result).toMatchObject({ ok: true, employeeId });
    expect(mocks.validateOrganizationPathForActor).toHaveBeenCalled();
    expect(mocks.employeeCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: "user-1", employeeCode: "AIRA-001", designationId }) }));
  });

  it("updates an authorized Employee without changing its User identity", async () => {
    const form = employeeForm({ employeeId, employeeCode: "aira-002" });
    form.delete("userEmail");
    const result = await updateEmployeeAction({ ok: false, message: "" }, form);
    expect(result).toMatchObject({ ok: true, employeeId });
    expect(mocks.assertEmployeeAccess).toHaveBeenCalledWith(expect.anything(), "employee.update", employeeId);
    expect(mocks.employeeUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ employeeCode: "AIRA-002" }) }));
  });

  it("denies employee creation to a role without employee.create", async () => {
    mocks.getCurrentUser.mockResolvedValue(actor("Student"));
    await expect(createEmployeeAction({ ok: false, message: "" }, employeeForm())).rejects.toBeInstanceOf(AuthorizationError);
    expect(mocks.employeeCreate).not.toHaveBeenCalled();
  });

  it("denies a manager outside the actor's authorized scope", async () => {
    mocks.assertEmployeeAccess.mockRejectedValueOnce(new AuthorizationError("Employee was not found in the authorized organization scope"));
    await expect(createEmployeeAction({ ok: false, message: "" }, employeeForm({ managerId: "00000000-0000-4000-8000-000000000004" }))).rejects.toThrow("authorized organization scope");
    expect(mocks.employeeCreate).not.toHaveBeenCalled();
  });
});
