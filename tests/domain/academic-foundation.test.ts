import { describe, expect, it } from "vitest";
import { ALTT_STAGES, alttStageProgress, resolveAlttStage } from "@/lib/academic/altt";
import { assignmentCoversAcademicResource, hasEffectiveAssignment, validateBatchConfiguration } from "@/lib/academic/validation";
import { trainerAssessmentScope, trainerReflectionScope, trainerSubmissionScope } from "@/server/academic/access";

describe("Startup School academic foundation", () => {
  it("defines the complete ALTT operating cycle", () => {
    expect(ALTT_STAGES).toEqual(["LEARN", "PRACTISE", "BUILD", "DEPLOY", "EARN", "GROW"]);
  });

  it("maps existing learning types to ALTT stages", () => {
    expect(resolveAlttStage({ type: "ARTICLE" })).toBe("LEARN");
    expect(resolveAlttStage({ type: "QUIZ" })).toBe("PRACTISE");
    expect(resolveAlttStage({ type: "PROJECT" })).toBe("BUILD");
    expect(resolveAlttStage({ type: "EXTERNAL_LINK" })).toBe("DEPLOY");
    expect(resolveAlttStage({ type: "ASSESSMENT" })).toBe("GROW");
  });

  it("uses explicit metadata for earn and other outcome stages", () => {
    expect(resolveAlttStage({ type: "REFLECTION", metadata: { alttStage: "EARN" } })).toBe("EARN");
  });

  it("summarizes stage distribution without another progress model", () => {
    expect(alttStageProgress([{ type: "ARTICLE" }, { type: "QUIZ" }, { type: "PROJECT" }])).toMatchObject({ LEARN: 1, PRACTISE: 1, BUILD: 1 });
  });

  it("rejects a journey from another program", () => {
    expect(validateBatchConfiguration({ program: { id: "program-1" }, journey: { programId: "program-2" } })).toContain("Journey belongs to another program.");
  });

  it("rejects conflicting centres and invalid dates", () => {
    const issues = validateBatchConfiguration({
      program: { id: "program-1", campusId: "centre-1" },
      campusId: "centre-2",
      startsAt: new Date("2026-10-02"),
      endsAt: new Date("2026-10-01")
    });
    expect(issues).toEqual(["Batch centre conflicts with the program centre.", "Batch end date must be after its start date."]);
  });

  it("accepts only effective trainer assignments", () => {
    const now = new Date("2026-09-28T10:00:00Z");
    expect(hasEffectiveAssignment({ status: "ACTIVE", startsAt: new Date("2026-09-01"), endsAt: new Date("2026-10-01") }, now)).toBe(true);
    expect(hasEffectiveAssignment({ status: "ACTIVE", startsAt: new Date("2026-10-01") }, now)).toBe(false);
    expect(hasEffectiveAssignment({ status: "ENDED" }, now)).toBe(false);
  });

  it("prevents cross-division and cross-centre trainer assignment", () => {
    const resource = { institutionId: "org-1", divisionId: "division-1", campusId: "centre-1" };
    expect(assignmentCoversAcademicResource({ institutionId: "org-1", divisionId: "division-1", campusId: "centre-1" }, resource)).toBe(true);
    expect(assignmentCoversAcademicResource({ institutionId: "org-1", divisionId: "division-2" }, resource)).toBe(false);
    expect(assignmentCoversAcademicResource({ institutionId: "org-1", campusId: "centre-2" }, resource)).toBe(false);
  });

  it("builds trainer artifact predicates from assigned students, journey, and batch", () => {
    const assignments = [{ batchId: "batch-1", journeyId: "journey-1", studentIds: ["student-1"] }];
    const submission = JSON.stringify(trainerSubmissionScope(assignments));
    const reflection = JSON.stringify(trainerReflectionScope(assignments));
    const assessment = JSON.stringify(trainerAssessmentScope(assignments));
    for (const predicate of [submission, reflection, assessment]) {
      expect(predicate).toContain("student-1");
      expect(predicate).toContain("journey-1");
      expect(predicate).not.toContain("student-2");
    }
    expect(submission).toContain("batch-1");
    expect(assessment).toContain("batch-1");
  });
});
