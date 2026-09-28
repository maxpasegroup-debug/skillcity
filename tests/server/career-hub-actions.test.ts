import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { AuthorizationError } from "@/server/auth/authorization";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  validateOrganizationPathForActor: vi.fn(),
  assertCareerEmployerAccess: vi.fn(),
  assertCareerOpportunityAccess: vi.fn(),
  assertCareerOpportunityApplicationAccess: vi.fn(),
  employeeFindFirst: vi.fn(),
  employerFindFirst: vi.fn(), employerCreate: vi.fn(), employerUpdate: vi.fn(),
  opportunityFindUnique: vi.fn(), opportunityFindFirst: vi.fn(), opportunityCreate: vi.fn(), opportunityUpdate: vi.fn(),
  profileFindUnique: vi.fn(), profileUpsert: vi.fn(),
  applicationCreate: vi.fn(), applicationFindFirst: vi.fn(), applicationFindUnique: vi.fn(), applicationUpdate: vi.fn(),
  referralFindUnique: vi.fn(), referralCreate: vi.fn(),
  auditCreate: vi.fn()
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/organization/service", () => ({ validateOrganizationPathForActor: mocks.validateOrganizationPathForActor }));
vi.mock("@/server/auth/resource-access", () => ({
  assertCareerEmployerAccess: mocks.assertCareerEmployerAccess,
  assertCareerOpportunityAccess: mocks.assertCareerOpportunityAccess,
  assertCareerOpportunityApplicationAccess: mocks.assertCareerOpportunityApplicationAccess
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  employee: { findFirst: mocks.employeeFindFirst },
  careerEmployer: { findFirst: mocks.employerFindFirst, update: mocks.employerUpdate },
  careerOpportunity: { findUnique: mocks.opportunityFindUnique, findFirst: mocks.opportunityFindFirst, update: mocks.opportunityUpdate },
  careerTalentProfile: { findUnique: mocks.profileFindUnique, upsert: mocks.profileUpsert },
  careerOpportunityApplication: { findFirst: mocks.applicationFindFirst, findUnique: mocks.applicationFindUnique, update: mocks.applicationUpdate },
  careerReferral: { findUnique: mocks.referralFindUnique },
  platformAudit: { create: mocks.auditCreate },
  $transaction: vi.fn(async (input: unknown) => typeof input === "function" ? input({
    careerEmployer: { create: mocks.employerCreate },
    careerOpportunity: { create: mocks.opportunityCreate, findUnique: mocks.opportunityFindUnique },
    careerOpportunityApplication: { create: mocks.applicationCreate },
    careerReferral: { create: mocks.referralCreate },
    platformAudit: { create: mocks.auditCreate }
  }) : input)
} }));

import { applyToCareerOpportunityAction, createCareerEmployerAction, createCareerOpportunityAction, createCareerReferralAction, updateCareerApplicationStatusAction } from "@/actions/career-hub";

const institutionId = "00000000-0000-4000-8000-000000000001";
const divisionId = "00000000-0000-4000-8000-000000000002";
const employerId = "00000000-0000-4000-8000-000000000003";
const employeeId = "00000000-0000-4000-8000-000000000004";
const opportunityId = "00000000-0000-4000-8000-000000000005";
const profileId = "00000000-0000-4000-8000-000000000006";
const applicationId = "00000000-0000-4000-8000-000000000007";

function actor(role = "Director") { return { id: "actor-1", roles: [{ role: { name: role } }], employeeProfile: { institutionId, divisionId } }; }
function employer(status = "VERIFIED") { return { id: employerId, institutionId, divisionId, districtId: null, campusId: null, departmentId: null, code: "acme", status }; }
function opportunity() { return { id: opportunityId, institutionId, divisionId, employerId, ownerEmployeeId: employeeId, code: "frontend-intern", title: "Frontend Intern", status: "OPEN", visibility: "PUBLIC", capacity: 2, applicationDeadline: new Date("2099-01-01"), applications: [] }; }
function opportunityForm() { const form = new FormData(); for (const [key, value] of Object.entries({ employerId, ownerEmployeeId: employeeId, code: "frontend-intern", title: "Frontend Intern", publicDescription: "Build and ship supervised production user interfaces.", type: "INTERNSHIP", workMode: "HYBRID", status: "OPEN", visibility: "PUBLIC", institutionId, divisionId })) form.set(key, value); return form; }

describe("AIRA Career Hub mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(actor());
    mocks.validateOrganizationPathForActor.mockResolvedValue(undefined);
    mocks.assertCareerEmployerAccess.mockResolvedValue(undefined);
    mocks.assertCareerOpportunityAccess.mockResolvedValue(undefined);
    mocks.assertCareerOpportunityApplicationAccess.mockResolvedValue(undefined);
    mocks.employeeFindFirst.mockResolvedValue({ id: employeeId, institutionId, divisionId, districtId: null, campusId: null, departmentId: null, status: "ACTIVE", user: { id: "owner-user", status: "ACTIVE" }, organizationAssignments: [] });
    mocks.employerFindFirst.mockResolvedValue(employer());
    mocks.employerCreate.mockResolvedValue(employer("PENDING"));
    mocks.employerUpdate.mockResolvedValue(employer());
    mocks.opportunityFindUnique.mockResolvedValue(opportunity());
    mocks.opportunityFindFirst.mockResolvedValue(opportunity());
    mocks.opportunityCreate.mockResolvedValue(opportunity());
    mocks.opportunityUpdate.mockResolvedValue(opportunity());
    mocks.profileFindUnique.mockResolvedValue({ id: profileId, userId: "student-1", availability: "AVAILABLE" });
    mocks.profileUpsert.mockResolvedValue({ id: profileId });
    mocks.applicationCreate.mockResolvedValue({ id: applicationId });
    mocks.applicationFindUnique.mockResolvedValue({ id: applicationId, status: "SUBMITTED" });
    mocks.applicationFindFirst.mockResolvedValue(null);
    mocks.applicationUpdate.mockResolvedValue({ id: applicationId });
    mocks.referralFindUnique.mockResolvedValue(null);
    mocks.referralCreate.mockResolvedValue({ id: "referral-1", code: "NICE-ABC123" });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("creates a scoped opportunity with Employee ownership and audit", async () => {
    const result = await createCareerOpportunityAction({ ok: false, message: "" }, opportunityForm());
    expect(result).toMatchObject({ ok: true, code: "frontend-intern" });
    expect(mocks.validateOrganizationPathForActor).toHaveBeenCalled();
    expect(mocks.opportunityCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ employerId, ownerEmployeeId: employeeId, code: "frontend-intern" }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "CAREER_OPPORTUNITY_CREATED" }) }));
  });

  it("denies opportunity creation without permission", async () => {
    mocks.getCurrentUser.mockResolvedValue(actor("Student"));
    await expect(createCareerOpportunityAction({ ok: false, message: "" }, opportunityForm())).rejects.toBeInstanceOf(AuthorizationError);
    expect(mocks.opportunityCreate).not.toHaveBeenCalled();
  });

  it("rejects organization mismatch and inactive owners", async () => {
    mocks.employerFindFirst.mockResolvedValue({ ...employer(), institutionId: "other-org" });
    expect((await createCareerOpportunityAction({ ok: false, message: "" }, opportunityForm())).message).toContain("does not match");
    mocks.employerFindFirst.mockResolvedValue(employer()); mocks.employeeFindFirst.mockResolvedValue(null);
    await expect(createCareerOpportunityAction({ ok: false, message: "" }, opportunityForm())).rejects.toThrow("active Employee");
  });

  it("does not publish an unverified employer opportunity", async () => {
    mocks.employerFindFirst.mockResolvedValue(employer("PENDING"));
    const result = await createCareerOpportunityAction({ ok: false, message: "" }, opportunityForm());
    expect(result.message).toContain("verified employer");
    expect(mocks.opportunityCreate).not.toHaveBeenCalled();
  });

  it("reports duplicate opportunity codes", async () => {
    mocks.opportunityCreate.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "6.19.3" }));
    expect(await createCareerOpportunityAction({ ok: false, message: "" }, opportunityForm())).toEqual({ ok: false, message: "Opportunity code is already in use." });
  });

  it("creates employers as pending rather than falsely verified", async () => {
    const form = new FormData(); for (const [key, value] of Object.entries({ code: "acme", name: "Acme", publicDescription: "External technology opportunity partner.", institutionId })) form.set(key, value);
    const result = await createCareerEmployerAction({ ok: false, message: "" }, form);
    expect(result.ok).toBe(true);
    expect(mocks.employerCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.not.objectContaining({ status: "VERIFIED" }) }));
  });

  it("submits an application using the session identity and private profile", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "student-1", roles: [{ role: { name: "Student" } }] });
    const form = new FormData(); form.set("opportunityId", opportunityId); form.set("coverNote", "I can contribute to this role.");
    const result = await applyToCareerOpportunityAction({ ok: false, message: "" }, form);
    expect(result.ok).toBe(true);
    expect(mocks.applicationCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ applicantId: "student-1", talentProfileId: profileId }) }));
  });

  it("blocks application without a career profile", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "student-1", roles: [{ role: { name: "Student" } }] });
    mocks.profileFindUnique.mockResolvedValue(null);
    const form = new FormData(); form.set("opportunityId", opportunityId);
    expect((await applyToCareerOpportunityAction({ ok: false, message: "" }, form)).message).toContain("profile");
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
  });

  it("reports duplicate applications without exposing another candidate", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "student-1", roles: [{ role: { name: "Student" } }] });
    mocks.applicationCreate.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "6.19.3" }));
    const form = new FormData(); form.set("opportunityId", opportunityId);
    expect((await applyToCareerOpportunityAction({ ok: false, message: "" }, form)).message).toContain("already applied");
  });

  it("blocks crafted application IDs through scoped access", async () => {
    mocks.assertCareerOpportunityApplicationAccess.mockRejectedValue(new AuthorizationError("outside authorized opportunity"));
    const form = new FormData(); form.set("applicationId", applicationId); form.set("status", "SHORTLISTED");
    await expect(updateCareerApplicationStatusAction({ ok: false, message: "" }, form)).rejects.toThrow("authorized opportunity");
    expect(mocks.applicationUpdate).not.toHaveBeenCalled();
  });

  it("creates non-financial referral attribution and preserves duplicates", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "student-1", roles: [{ role: { name: "Student" } }] });
    const form = new FormData(); form.set("opportunityId", opportunityId);
    const first = await createCareerReferralAction({ ok: false, message: "" }, form);
    expect(first.message).toContain("No financial reward");
    mocks.referralFindUnique.mockResolvedValue({ id: "referral-1", code: "NICE-KEPT" });
    const duplicate = await createCareerReferralAction({ ok: false, message: "" }, form);
    expect(duplicate).toMatchObject({ ok: true, code: "NICE-KEPT" });
    expect(mocks.referralCreate).toHaveBeenCalledTimes(1);
  });
});
