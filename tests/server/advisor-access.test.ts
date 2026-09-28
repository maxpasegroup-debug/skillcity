import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({
  userFindFirst: vi.fn(),
  assignmentFindFirst: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.userFindFirst },
    academicAdvisorAssignment: { findFirst: mocks.assignmentFindFirst }
  }
}));

import { advisorStudentAccessWhere, assertAdvisorStudentAccess, getEffectiveStudentAdvisor } from "@/server/advisor/access";

function advisorActor() {
  return {
    id: "user-advisor",
    roles: [{ role: { name: "Academic Advisor" } }],
    employeeProfile: { id: "employee-advisor" }
  };
}

describe("academic advisor access", () => {
  beforeEach(() => vi.clearAllMocks());

  it("builds access from direct or batch assignment with direct override", () => {
    const predicate = JSON.stringify(advisorStudentAccessWhere("employee-advisor", new Date("2026-09-28T10:00:00Z")));
    expect(predicate).toContain("academicAdvisorAssignments");
    expect(predicate).toContain("enrollments");
    expect(predicate).toContain("employee-advisor");
    expect(predicate).toContain("none");
  });

  it("allows an advisor to read an assigned student", async () => {
    mocks.userFindFirst.mockResolvedValue({ id: "student-1" });
    await expect(assertAdvisorStudentAccess(advisorActor(), "student-1")).resolves.toEqual({ id: "student-1" });
  });

  it("denies an advisor access to an unassigned student", async () => {
    mocks.userFindFirst.mockResolvedValue(null);
    await expect(assertAdvisorStudentAccess(advisorActor(), "student-2")).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("denies a trainer even when an Employee profile exists", async () => {
    const trainer = { id: "trainer", roles: [{ role: { name: "Trainer" } }], employeeProfile: { id: "employee-trainer" } };
    await expect(assertAdvisorStudentAccess(trainer, "student-1")).rejects.toBeInstanceOf(AuthorizationError);
    expect(mocks.userFindFirst).not.toHaveBeenCalled();
  });

  it("returns direct student assignment before batch assignment", async () => {
    mocks.assignmentFindFirst.mockResolvedValueOnce({ id: "direct", advisor: { user: { name: "Advisor" } } });
    const result = await getEffectiveStudentAdvisor("student-1", "batch-1", new Date("2026-09-28T10:00:00Z"));
    expect(result).toMatchObject({ source: "STUDENT", assignment: { id: "direct" } });
    expect(mocks.assignmentFindFirst).toHaveBeenCalledTimes(1);
  });

  it("falls back to batch assignment when no direct assignment exists", async () => {
    mocks.assignmentFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "batch", advisor: { user: { name: "Advisor" } } });
    const result = await getEffectiveStudentAdvisor("student-1", "batch-1", new Date("2026-09-28T10:00:00Z"));
    expect(result).toMatchObject({ source: "BATCH", assignment: { id: "batch" } });
  });
});
