import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  validateOrganizationPathForActor: vi.fn(),
  programFindFirst: vi.fn(),
  programCreate: vi.fn(),
  programUpdate: vi.fn(),
  journeyFindUnique: vi.fn(),
  batchFindFirst: vi.fn(),
  batchCreate: vi.fn(),
  userFindFirst: vi.fn(),
  trainerUpsert: vi.fn(),
  auditCreate: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/organization/service", () => ({ validateOrganizationPathForActor: mocks.validateOrganizationPathForActor }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  program: { findFirst: mocks.programFindFirst, update: mocks.programUpdate },
  journey: { findUnique: mocks.journeyFindUnique },
  batch: { findFirst: mocks.batchFindFirst },
  user: { findFirst: mocks.userFindFirst },
  platformAudit: { create: mocks.auditCreate },
  $transaction: vi.fn(async (input: unknown) => typeof input === "function"
    ? input({ program: { create: mocks.programCreate }, batch: { create: mocks.batchCreate }, trainerAssignment: { upsert: mocks.trainerUpsert }, platformAudit: { create: mocks.auditCreate } })
    : input)
} }));

import { assignSkillStudioTrainerAction, createSkillStudioBatchAction, createSkillStudioProgramAction } from "@/actions/skill-studio";

const institutionId = "00000000-0000-4000-8000-000000000001";
const divisionId = "00000000-0000-4000-8000-000000000002";
const campusId = "00000000-0000-4000-8000-000000000003";
const programId = "00000000-0000-4000-8000-000000000004";
const journeyId = "00000000-0000-4000-8000-000000000005";
const batchId = "00000000-0000-4000-8000-000000000006";
const trainerId = "00000000-0000-4000-8000-000000000007";

function actor(role = "Director") {
  return { id: "actor-1", roles: [{ role: { name: role } }], employeeProfile: { institutionId, divisionId } };
}

function program() {
  return { id: programId, slug: "digital-marketing", institutionId, divisionId, campusId, departmentId: null, status: "ACTIVE", deliveryMode: "HYBRID", operatingDomain: "SKILL_STUDIO" };
}

function programForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: "Digital Marketing", slug: "digital-marketing", description: "Practical professional skill program.", durationDays: "30", type: "COURSE", deliveryMode: "HYBRID", learningModel: "STANDARD", status: "DRAFT", admissionStatus: "CLOSED", institutionId, divisionId, campusId })) form.set(key, value);
  return form;
}

describe("AIRA Skill Studio mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(actor());
    mocks.validateOrganizationPathForActor.mockResolvedValue(undefined);
    mocks.programFindFirst.mockResolvedValue(program());
    mocks.programCreate.mockResolvedValue(program());
    mocks.programUpdate.mockResolvedValue(program());
    mocks.journeyFindUnique.mockResolvedValue({ programId });
    mocks.batchCreate.mockResolvedValue({ id: batchId, name: "October Cohort" });
    mocks.batchFindFirst.mockResolvedValue({ id: batchId, campusId, program: program() });
    mocks.userFindFirst.mockResolvedValue({ id: trainerId, employeeProfile: { institutionId, divisionId, campusId, organizationAssignments: [] } });
    mocks.trainerUpsert.mockResolvedValue({ id: "assignment-1", status: "ACTIVE" });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("creates a scoped central Program, curriculum, and audit atomically", async () => {
    const result = await createSkillStudioProgramAction({ ok: false, message: "" }, programForm());
    expect(result).toMatchObject({ ok: true, slug: "digital-marketing" });
    expect(mocks.validateOrganizationPathForActor).toHaveBeenCalled();
    expect(mocks.programCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ operatingDomain: "SKILL_STUDIO", learningModel: "STANDARD", journeys: expect.any(Object) }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "SKILL_STUDIO_PROGRAM_CREATED" }) }));
  });

  it("denies program creation without centralized permission", async () => {
    mocks.getCurrentUser.mockResolvedValue(actor("Student"));
    await expect(createSkillStudioProgramAction({ ok: false, message: "" }, programForm())).rejects.toBeInstanceOf(AuthorizationError);
    expect(mocks.programCreate).not.toHaveBeenCalled();
  });

  it("reports duplicate stable slugs", async () => {
    mocks.programCreate.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "6.19.3" }));
    const result = await createSkillStudioProgramAction({ ok: false, message: "" }, programForm());
    expect(result).toEqual({ ok: false, message: "Program slug is already in use." });
  });

  it("creates a batch through the existing Batch model", async () => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ programId, journeyId, campusId, name: "October Cohort", deliveryMode: "HYBRID", enrollmentLimit: "20", status: "DRAFT" })) form.set(key, value);
    const result = await createSkillStudioBatchAction({ ok: false, message: "" }, form);
    expect(result.ok).toBe(true);
    expect(mocks.batchCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ programId, journeyId, enrollmentLimit: 20 }) }));
  });

  it("rejects a curriculum from another program", async () => {
    mocks.journeyFindUnique.mockResolvedValue({ programId: "another-program" });
    const form = new FormData();
    for (const [key, value] of Object.entries({ programId, journeyId, campusId, name: "October Cohort", deliveryMode: "HYBRID", status: "DRAFT" })) form.set(key, value);
    const result = await createSkillStudioBatchAction({ ok: false, message: "" }, form);
    expect(result.message).toContain("another program");
    expect(mocks.batchCreate).not.toHaveBeenCalled();
  });

  it("assigns an eligible Employee trainer to the existing TrainerAssignment", async () => {
    const form = new FormData(); form.set("batchId", batchId); form.set("trainerId", trainerId);
    const result = await assignSkillStudioTrainerAction({ ok: false, message: "" }, form);
    expect(result.ok).toBe(true);
    expect(mocks.trainerUpsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ trainerId, batchId, role: "Skill Studio Trainer" }) }));
  });

  it("rejects trainer organization mismatch", async () => {
    mocks.userFindFirst.mockResolvedValue({ id: trainerId, employeeProfile: { institutionId: "other-org", divisionId: "other-division", campusId: null, organizationAssignments: [] } });
    const form = new FormData(); form.set("batchId", batchId); form.set("trainerId", trainerId);
    await expect(assignSkillStudioTrainerAction({ ok: false, message: "" }, form)).rejects.toThrow("does not cover");
    expect(mocks.trainerUpsert).not.toHaveBeenCalled();
  });
});
