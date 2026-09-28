import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  assertEmployeeAccess: vi.fn(),
  assertStudentAccess: vi.fn(),
  assertBatchAccess: vi.fn(),
  employeeFindFirst: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  batchFindUnique: vi.fn(),
  assignmentFindFirst: vi.fn(),
  assignmentFindUnique: vi.fn(),
  assignmentCreate: vi.fn(),
  assignmentUpdate: vi.fn(),
  auditCreate: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/auth/resource-access", () => ({
  assertEmployeeAccess: mocks.assertEmployeeAccess,
  assertStudentAccess: mocks.assertStudentAccess,
  assertBatchAccess: mocks.assertBatchAccess
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    employee: { findFirst: mocks.employeeFindFirst },
    studentEnrollment: { findFirst: mocks.enrollmentFindFirst },
    batch: { findUnique: mocks.batchFindUnique },
    academicAdvisorAssignment: { findUnique: mocks.assignmentFindUnique, update: mocks.assignmentUpdate },
    platformAudit: { create: mocks.auditCreate },
    $transaction: vi.fn(async (input: unknown) => typeof input === "function"
      ? input({
          academicAdvisorAssignment: { findFirst: mocks.assignmentFindFirst, create: mocks.assignmentCreate },
          platformAudit: { create: mocks.auditCreate }
        })
      : input)
  }
}));

import { createAdvisorAssignmentAction, endAdvisorAssignmentAction } from "@/actions/advisors";

const advisorId = "00000000-0000-4000-8000-000000000001";
const studentId = "00000000-0000-4000-8000-000000000002";
const batchId = "00000000-0000-4000-8000-000000000003";
const assignmentId = "00000000-0000-4000-8000-000000000004";

function actor(role = "Director") {
  return { id: "actor-1", roles: [{ role: { name: role } }], accessScopes: [], employeeProfile: { id: "actor-employee", institutionId: "org-1" } };
}

function assignmentForm(targetType: "STUDENT" | "BATCH" = "STUDENT") {
  const form = new FormData();
  form.set("advisorId", advisorId);
  form.set("targetType", targetType);
  form.set(targetType === "STUDENT" ? "studentId" : "batchId", targetType === "STUDENT" ? studentId : batchId);
  form.set("startsAt", "2026-09-28T09:00");
  return form;
}

describe("academic advisor assignment actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(actor());
    mocks.employeeFindFirst.mockResolvedValue({
      id: advisorId,
      institutionId: "org-1",
      divisionId: "division-1",
      campusId: "centre-1",
      organizationAssignments: [],
      user: { id: "advisor-user", status: "ACTIVE" }
    });
    mocks.enrollmentFindFirst.mockResolvedValue({
      program: { institutionId: "org-1", divisionId: "division-1", campusId: "centre-1" },
      batch: { campusId: "centre-1" }
    });
    mocks.batchFindUnique.mockResolvedValue({
      id: batchId,
      campusId: "centre-1",
      program: { institutionId: "org-1", divisionId: "division-1", campusId: "centre-1" }
    });
    mocks.assignmentFindFirst.mockResolvedValue(null);
    mocks.assignmentCreate.mockResolvedValue({ id: assignmentId });
    mocks.assignmentUpdate.mockResolvedValue({ id: assignmentId, status: "INACTIVE" });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("creates a scoped direct student assignment with an audit record", async () => {
    const result = await createAdvisorAssignmentAction({ ok: false, message: "" }, assignmentForm());
    expect(result.ok).toBe(true);
    expect(mocks.assertStudentAccess).toHaveBeenCalledWith(expect.anything(), "advisor.assign", studentId);
    expect(mocks.assignmentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ advisorId, studentId, createdById: "actor-1" }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "ACADEMIC_ADVISOR_ASSIGNED" }) }));
  });

  it("creates a batch assignment through batch scope", async () => {
    const result = await createAdvisorAssignmentAction({ ok: false, message: "" }, assignmentForm("BATCH"));
    expect(result.ok).toBe(true);
    expect(mocks.assertBatchAccess).toHaveBeenCalledWith(expect.anything(), "advisor.assign", batchId);
    expect(mocks.assignmentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ advisorId, batchId }) }));
  });

  it("denies assignment creation without advisor.assign", async () => {
    mocks.getCurrentUser.mockResolvedValue(actor("Trainer"));
    await expect(createAdvisorAssignmentAction({ ok: false, message: "" }, assignmentForm())).rejects.toBeInstanceOf(AuthorizationError);
    expect(mocks.assignmentCreate).not.toHaveBeenCalled();
  });

  it("rejects an advisor whose organization does not cover the student", async () => {
    mocks.employeeFindFirst.mockResolvedValue({ id: advisorId, institutionId: "org-2", organizationAssignments: [], user: { id: "advisor-user" } });
    const result = await createAdvisorAssignmentAction({ ok: false, message: "" }, assignmentForm());
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining("does not cover") });
    expect(mocks.assignmentCreate).not.toHaveBeenCalled();
  });

  it("prevents overlapping direct assignment to another advisor", async () => {
    mocks.assignmentFindFirst.mockResolvedValue({ id: "existing" });
    const result = await createAdvisorAssignmentAction({ ok: false, message: "" }, assignmentForm());
    expect(result).toMatchObject({ ok: false, message: expect.stringContaining("overlapping direct") });
    expect(mocks.assignmentCreate).not.toHaveBeenCalled();
  });

  it("ends an assignment without deleting its history", async () => {
    mocks.assignmentFindUnique.mockResolvedValue({ id: assignmentId, studentId, batchId: null, startsAt: new Date("2026-09-01"), endsAt: null });
    const form = new FormData();
    form.set("assignmentId", assignmentId);
    const result = await endAdvisorAssignmentAction({ ok: false, message: "" }, form);
    expect(result.ok).toBe(true);
    expect(mocks.assignmentUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: assignmentId }, data: expect.objectContaining({ status: "INACTIVE" }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "ACADEMIC_ADVISOR_ASSIGNMENT_ENDED" }) }));
  });
});
