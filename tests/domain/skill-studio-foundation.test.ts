import { describe, expect, it } from "vitest";
import { createSkillStudioBatchSchema, createSkillStudioProgramSchema } from "@/features/skill-studio/schemas";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { PROGRAM_DELIVERY_MODES, SKILL_STUDIO_PROGRAM_TYPES, normalizeProgramSlug, usesAltt, validateSkillStudioBatch } from "@/lib/skill-studio/program";
import { skillStudioBatchScopeWhere, skillStudioProgramScopeWhere } from "@/server/auth/scoping";

const id = (suffix: string) => `00000000-0000-4000-8000-0000000000${suffix}`;
const role = (name: string) => [{ role: { name } }];

describe("AIRA Skill Studio foundation", () => {
  it("uses the central Program with a focused type and delivery catalog", () => {
    expect(SKILL_STUDIO_PROGRAM_TYPES).toEqual(["COURSE", "WORKSHOP", "BOOTCAMP", "MASTERCLASS", "PROFESSIONAL_PROGRAM", "CORPORATE_TRAINING"]);
    expect(PROGRAM_DELIVERY_MODES).toEqual(["ONLINE", "OFFLINE", "HYBRID"]);
  });

  it("normalizes stable program slugs", () => {
    expect(normalizeProgramSlug("  digital-marketing  ")).toBe("digital-marketing");
  });

  it("validates a Skill Studio program with explicit learning model", () => {
    const result = createSkillStudioProgramSchema.safeParse({ name: "Digital Marketing", slug: "digital-marketing", description: "Practical professional skill program.", durationDays: 30, type: "COURSE", deliveryMode: "HYBRID", learningModel: "STANDARD", status: "DRAFT", admissionStatus: "CLOSED", institutionId: id("01"), divisionId: id("02") });
    expect(result.success).toBe(true);
  });

  it("rejects malformed program slugs", () => {
    const result = createSkillStudioProgramSchema.safeParse({ name: "Digital Marketing", slug: "Digital Marketing!", description: "Practical professional skill program.", durationDays: 30, type: "COURSE", deliveryMode: "ONLINE", learningModel: "STANDARD", status: "DRAFT", admissionStatus: "CLOSED", institutionId: id("01"), divisionId: id("02") });
    expect(result.success).toBe(false);
  });

  it("does not impose ALTT on standard Skill Studio programs", () => {
    expect(usesAltt({ operatingDomain: "SKILL_STUDIO", learningModel: "STANDARD" })).toBe(false);
    expect(usesAltt({ operatingDomain: "SKILL_STUDIO", learningModel: "ALTT" })).toBe(true);
    expect(usesAltt({ operatingDomain: null, learningModel: null })).toBe(true);
  });

  it("requires a centre for offline and hybrid batches", () => {
    expect(validateSkillStudioBatch({ programId: "program-1", deliveryMode: "OFFLINE" })).toContain("Offline and hybrid batches require a centre.");
    expect(validateSkillStudioBatch({ programId: "program-1", deliveryMode: "ONLINE" })).toEqual([]);
  });

  it("rejects a cross-program curriculum and invalid dates", () => {
    const issues = validateSkillStudioBatch({ programId: "program-1", journeyProgramId: "program-2", deliveryMode: "ONLINE", startsAt: new Date("2026-10-02"), endsAt: new Date("2026-10-01") });
    expect(issues).toEqual(["Journey belongs to another program.", "Batch end date must be after its start date."]);
  });

  it("validates batch capacity and controlled delivery", () => {
    const result = createSkillStudioBatchSchema.safeParse({ programId: id("01"), journeyId: id("02"), name: "October Cohort", enrollmentLimit: 20, deliveryMode: "HYBRID", status: "DRAFT" });
    expect(result.success).toBe(true);
  });

  it("grants management through centralized permissions", () => {
    expect(hasPermission({ id: "director", roles: role("Director") }, PERMISSIONS.SKILL_STUDIO_MANAGE)).toBe(true);
    expect(hasPermission({ id: "student", roles: role("Student") }, PERMISSIONS.SKILL_STUDIO_CREATE)).toBe(false);
  });

  it("limits students to programs from their own enrollments", () => {
    const predicate = JSON.stringify(skillStudioProgramScopeWhere({ id: "student-1", roles: role("Student") }, PERMISSIONS.SKILL_STUDIO_READ));
    expect(predicate).toContain("SKILL_STUDIO");
    expect(predicate).toContain("student-1");
    expect(predicate).toContain("enrollments");
  });

  it("limits trainers to their assigned Skill Studio batches", () => {
    const predicate = JSON.stringify(skillStudioBatchScopeWhere({ id: "trainer-1", roles: role("Trainer") }, PERMISSIONS.SKILL_STUDIO_READ));
    expect(predicate).toContain("trainer-1");
    expect(predicate).toContain("trainerAssignments");
    expect(predicate).toContain("SKILL_STUDIO");
  });

  it("keeps organization scope in management predicates", () => {
    const actor = { id: "hod", roles: role("HOD"), employeeProfile: { institutionId: "org-1" } };
    expect(JSON.stringify(skillStudioProgramScopeWhere(actor, PERMISSIONS.SKILL_STUDIO_READ))).toContain("org-1");
  });
});
