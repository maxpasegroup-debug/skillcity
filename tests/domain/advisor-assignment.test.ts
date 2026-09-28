import { describe, expect, it } from "vitest";
import { advisorAssignmentSchema } from "@/features/advisors/schemas";
import { assignmentWindowsOverlap, hasExactlyOneAdvisorTarget, isEffectiveAdvisorAssignment, resolveAdvisorAssignmentSource } from "@/lib/advisors/assignment";

const advisorId = "00000000-0000-4000-8000-000000000001";
const studentId = "00000000-0000-4000-8000-000000000002";
const batchId = "00000000-0000-4000-8000-000000000003";

describe("academic advisor assignment rules", () => {
  it("accepts exactly one student or batch target", () => {
    expect(hasExactlyOneAdvisorTarget({ studentId })).toBe(true);
    expect(hasExactlyOneAdvisorTarget({ batchId })).toBe(true);
    expect(hasExactlyOneAdvisorTarget({ studentId, batchId })).toBe(false);
    expect(hasExactlyOneAdvisorTarget({})).toBe(false);
  });

  it("validates direct student assignment input", () => {
    const result = advisorAssignmentSchema.safeParse({ advisorId, targetType: "STUDENT", studentId, startsAt: "2026-09-28T09:00" });
    expect(result.success).toBe(true);
  });

  it("validates batch assignment input", () => {
    const result = advisorAssignmentSchema.safeParse({ advisorId, targetType: "BATCH", batchId, startsAt: "2026-09-28T09:00" });
    expect(result.success).toBe(true);
  });

  it("rejects ambiguous targets and invalid date order", () => {
    const result = advisorAssignmentSchema.safeParse({ advisorId, targetType: "STUDENT", studentId, batchId, startsAt: "2026-09-29T09:00", endsAt: "2026-09-28T09:00" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed effective dates", () => {
    const result = advisorAssignmentSchema.safeParse({ advisorId, targetType: "BATCH", batchId, startsAt: "not-a-date" });
    expect(result.success).toBe(false);
  });

  it("uses status and effective dates for active access", () => {
    const now = new Date("2026-09-28T10:00:00Z");
    expect(isEffectiveAdvisorAssignment({ status: "ACTIVE", startsAt: new Date("2026-09-01"), endsAt: new Date("2026-10-01") }, now)).toBe(true);
    expect(isEffectiveAdvisorAssignment({ status: "ACTIVE", startsAt: new Date("2026-10-01") }, now)).toBe(false);
    expect(isEffectiveAdvisorAssignment({ status: "INACTIVE", startsAt: new Date("2026-09-01") }, now)).toBe(false);
  });

  it("detects overlapping effective windows", () => {
    expect(assignmentWindowsOverlap(
      { startsAt: new Date("2026-09-01"), endsAt: new Date("2026-10-01") },
      { startsAt: new Date("2026-09-15"), endsAt: null }
    )).toBe(true);
    expect(assignmentWindowsOverlap(
      { startsAt: new Date("2026-09-01"), endsAt: new Date("2026-09-15") },
      { startsAt: new Date("2026-09-15"), endsAt: null }
    )).toBe(false);
  });

  it("gives explicit student assignment precedence over batch assignment", () => {
    expect(resolveAdvisorAssignmentSource({ directAdvisorIds: ["advisor-2"], batchAdvisorIds: ["advisor-1"], advisorId: "advisor-1" })).toBeNull();
    expect(resolveAdvisorAssignmentSource({ directAdvisorIds: ["advisor-1"], batchAdvisorIds: ["advisor-2"], advisorId: "advisor-1" })).toBe("STUDENT");
    expect(resolveAdvisorAssignmentSource({ directAdvisorIds: [], batchAdvisorIds: ["advisor-1"], advisorId: "advisor-1" })).toBe("BATCH");
  });
});
