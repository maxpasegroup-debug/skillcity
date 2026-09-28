import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({
  dayFindUnique: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  activityFindUnique: vi.fn(),
  stepFindFirst: vi.fn(),
  reflectionCount: vi.fn(),
  batchFindMany: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    journeyDay: { findUnique: mocks.dayFindUnique },
    studentEnrollment: { findFirst: mocks.enrollmentFindFirst },
    activity: { findUnique: mocks.activityFindUnique },
    learningStep: { findFirst: mocks.stepFindFirst },
    reflection: { count: mocks.reflectionCount },
    batch: { findMany: mocks.batchFindMany }
  }
}));

import { assertStudentActivityAccess, assertStudentDayAccess, assertStudentReflectionAccess, assertStudentStepAccess, assertTrainerArtifactAccess } from "@/server/academic/access";

const day = { id: "day-1", week: { phase: { journeyId: "journey-1" } } };
const enrollment = { id: "enrollment-1", batchId: "batch-1", programId: "program-1", journeyId: "journey-1", currentDay: 1 };

describe("academic resource access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dayFindUnique.mockResolvedValue(day);
    mocks.enrollmentFindFirst.mockResolvedValue(enrollment);
    mocks.activityFindUnique.mockResolvedValue({ id: "activity-1", dayId: "day-1", batchId: "batch-1" });
    mocks.stepFindFirst.mockResolvedValue({ id: "step-1", type: "ARTICLE" });
    mocks.reflectionCount.mockResolvedValue(2);
    mocks.batchFindMany.mockResolvedValue([{ id: "batch-1", journeyId: "journey-1", enrollments: [{ studentId: "student-1" }] }]);
  });

  it("allows a student to access their active journey day", async () => {
    await expect(assertStudentDayAccess("student-1", "day-1")).resolves.toMatchObject({ enrollment });
  });

  it("denies cross-student or unenrolled journey access", async () => {
    mocks.enrollmentFindFirst.mockResolvedValue(null);
    await expect(assertStudentDayAccess("student-2", "day-1")).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("denies an activity assigned to another batch", async () => {
    mocks.activityFindUnique.mockResolvedValue({ id: "activity-2", dayId: "day-1", batchId: "batch-2" });
    await expect(assertStudentActivityAccess("student-1", "activity-2")).rejects.toThrow("another batch");
  });

  it("denies a step outside the selected day learning flow", async () => {
    mocks.stepFindFirst.mockResolvedValue(null);
    await expect(assertStudentStepAccess("student-1", "day-1", "step-2")).rejects.toThrow("does not belong");
  });

  it("denies reflection identifiers outside the selected day", async () => {
    mocks.reflectionCount.mockResolvedValue(1);
    await expect(assertStudentReflectionAccess("student-1", "day-1", ["reflection-1", "reflection-2"])).rejects.toThrow("does not belong");
  });

  it("allows a trainer to review an artifact in their effective batch", async () => {
    await expect(assertTrainerArtifactAccess("trainer-1", { studentId: "student-1", journeyId: "journey-1", activityBatchId: "batch-1" })).resolves.toMatchObject({ batchId: "batch-1" });
  });

  it("denies a trainer access to another student's artifact", async () => {
    await expect(assertTrainerArtifactAccess("trainer-1", { studentId: "student-2", journeyId: "journey-1" })).rejects.toBeInstanceOf(AuthorizationError);
  });
});
