"use server";

import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { assignmentCoversCareerResource, canTransitionCareerApplication, CAREER_OPPORTUNITY_TYPES, normalizeOpportunityCode, opportunityAcceptsApplications, splitCareerList } from "@/lib/career-hub/career";
import { careerApplicationSchema, careerApplicationStatusSchema, careerApplicationWithdrawSchema, careerEmployerSchema, careerEmployerVerificationSchema, careerOpportunitySchema, careerOpportunityStatusSchema, careerReferralSchema, careerTalentProfileSchema } from "@/features/career-hub/schemas";
import { assertPermission, AuthorizationError } from "@/server/auth/authorization";
import { assertCareerEmployerAccess, assertCareerOpportunityAccess, assertCareerOpportunityApplicationAccess } from "@/server/auth/resource-access";
import { careerEmployerScopeWhere, employeeScopeWhere } from "@/server/auth/scoping";
import { validateOrganizationPathForActor } from "@/server/organization/service";

export type CareerHubActionState = { ok: boolean; message: string; code?: string };

function failure(message: string): CareerHubActionState { return { ok: false, message }; }
function optional(value?: string) { return value?.trim() || null; }
function dateOrNull(value?: string) { return value ? new Date(value) : null; }

async function eligibleOpportunityOwner(actor: AuthorizationUser, employeeId: string, resource: { institutionId: string; divisionId?: string | null; districtId?: string | null; campusId?: string | null; departmentId?: string | null }) {
  const now = new Date();
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, AND: [employeeScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] }, user: { status: "ACTIVE", deletedAt: null } }] },
    include: { user: true, organizationAssignments: { where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] } } }
  });
  if (!employee) throw new AuthorizationError("Opportunity owner must be an active Employee in the authorized scope");
  if (![employee, ...employee.organizationAssignments].some((assignment) => assignmentCoversCareerResource(assignment, resource))) {
    throw new AuthorizationError("Employee organization assignment does not cover this opportunity");
  }
  return employee;
}

export async function saveCareerTalentProfileAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_PROFILE_MANAGE);
  const parsed = careerTalentProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check your career profile.");
  const data = parsed.data;
  const preferred = splitCareerList(data.preferredOpportunityTypes).filter((value): value is (typeof CAREER_OPPORTUNITY_TYPES)[number] => CAREER_OPPORTUNITY_TYPES.includes(value as (typeof CAREER_OPPORTUNITY_TYPES)[number]));
  await prisma.$transaction([
    prisma.careerTalentProfile.upsert({
      where: { userId: actor.id },
      update: { headline: optional(data.headline), bio: optional(data.bio), skills: splitCareerList(data.skills), experienceSummary: optional(data.experienceSummary), educationSummary: optional(data.educationSummary), preferredOpportunityTypes: preferred, workPreference: data.workPreference || null, availability: data.availability, location: optional(data.location), visibility: data.visibility },
      create: { userId: actor.id, headline: optional(data.headline), bio: optional(data.bio), skills: splitCareerList(data.skills), experienceSummary: optional(data.experienceSummary), educationSummary: optional(data.educationSummary), preferredOpportunityTypes: preferred, workPreference: data.workPreference || null, availability: data.availability, location: optional(data.location), visibility: data.visibility }
    }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_TALENT_PROFILE_SAVED", entity: "CareerTalentProfile", entityId: actor.id, metadata: { visibility: data.visibility } } })
  ]);
  revalidatePath("/career/profile");
  revalidatePath("/career");
  return { ok: true, message: "Career profile saved." };
}

export async function createCareerEmployerAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_OPPORTUNITY_MANAGE);
  const parsed = careerEmployerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check employer details.");
  const data = parsed.data;
  await validateOrganizationPathForActor(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE, { institutionId: data.institutionId, divisionId: optional(data.divisionId), districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId) });
  const code = normalizeOpportunityCode(data.code);
  try {
    const employer = await prisma.$transaction(async (tx) => {
      const created = await tx.careerEmployer.create({ data: { institutionId: data.institutionId, divisionId: optional(data.divisionId), districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId), code, name: data.name, publicDescription: data.publicDescription, websiteUrl: optional(data.websiteUrl), industry: optional(data.industry), contactName: optional(data.contactName), contactEmail: optional(data.contactEmail), createdById: actor.id } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_EMPLOYER_CREATED", entity: "CareerEmployer", entityId: created.id, metadata: { code } } });
      return created;
    });
    revalidatePath("/career/manage");
    return { ok: true, message: "Employer partner created as pending verification.", code: employer.code };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Employer code is already in use.");
    throw error;
  }
}

export async function verifyCareerEmployerAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_OPPORTUNITY_MANAGE);
  const parsed = careerEmployerVerificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check employer verification details.");
  await assertCareerEmployerAccess(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE, parsed.data.employerId);
  await prisma.$transaction([
    prisma.careerEmployer.update({ where: { id: parsed.data.employerId }, data: { status: parsed.data.status, verificationNote: optional(parsed.data.verificationNote), verifiedById: actor.id, verifiedAt: parsed.data.status === "VERIFIED" ? new Date() : null } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_EMPLOYER_STATUS_CHANGED", entity: "CareerEmployer", entityId: parsed.data.employerId, metadata: { status: parsed.data.status } } })
  ]);
  revalidatePath("/career/manage");
  return { ok: true, message: "Employer verification status updated." };
}

export async function createCareerOpportunityAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_OPPORTUNITY_MANAGE);
  const parsed = careerOpportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check opportunity details.");
  const data = parsed.data;
  const resource = { institutionId: data.institutionId, divisionId: optional(data.divisionId), districtId: optional(data.districtId), campusId: optional(data.campusId), departmentId: optional(data.departmentId) };
  await validateOrganizationPathForActor(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE, resource);
  const employer = await prisma.careerEmployer.findFirst({ where: { AND: [{ id: data.employerId }, careerEmployerScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE)] } });
  if (!employer) throw new AuthorizationError("Employer is outside the authorized Career Hub scope");
  if (!assignmentCoversCareerResource(employer, resource)) return failure("Employer organization scope does not match this opportunity.");
  if (data.status === "OPEN" && employer.status !== "VERIFIED") return failure("Only a verified employer can publish an open opportunity.");
  const owner = await eligibleOpportunityOwner(actor, data.ownerEmployeeId, resource);
  const deadline = dateOrNull(data.applicationDeadline);
  if (deadline && deadline <= new Date() && data.status === "OPEN") return failure("Open opportunity deadline must be in the future.");
  const code = normalizeOpportunityCode(data.code);
  try {
    const opportunity = await prisma.$transaction(async (tx) => {
      const created = await tx.careerOpportunity.create({ data: { ...resource, employerId: employer.id, ownerEmployeeId: owner.id, code, title: data.title, publicDescription: data.publicDescription, type: data.type, requiredSkills: splitCareerList(data.requiredSkills), workMode: data.workMode, location: optional(data.location), compensationSummary: optional(data.compensationSummary), applicationDeadline: deadline, capacity: typeof data.capacity === "number" ? data.capacity : null, status: data.status, visibility: data.visibility, archivedAt: data.status === "ARCHIVED" ? new Date() : null, createdById: actor.id } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_OPPORTUNITY_CREATED", entity: "CareerOpportunity", entityId: created.id, metadata: { code, employerId: employer.id, ownerEmployeeId: owner.id } } });
      return created;
    });
    revalidatePath("/career"); revalidatePath("/career/opportunities"); revalidatePath("/career/manage");
    return { ok: true, message: "Career opportunity created.", code: opportunity.code };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("Opportunity code is already in use.");
    throw error;
  }
}

export async function updateCareerOpportunityStatusAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_OPPORTUNITY_MANAGE);
  const parsed = careerOpportunityStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Choose a valid opportunity status and visibility.");
  await assertCareerOpportunityAccess(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE, parsed.data.opportunityId);
  const opportunity = await prisma.careerOpportunity.findUnique({ where: { id: parsed.data.opportunityId }, include: { employer: true } });
  if (!opportunity) throw new AuthorizationError("Career opportunity not found");
  if (parsed.data.status === "OPEN" && opportunity.employer.status !== "VERIFIED") return failure("Only a verified employer can publish an open opportunity.");
  await prisma.$transaction([
    prisma.careerOpportunity.update({ where: { id: opportunity.id }, data: { status: parsed.data.status, visibility: parsed.data.visibility, archivedAt: parsed.data.status === "ARCHIVED" ? opportunity.archivedAt ?? new Date() : null } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_OPPORTUNITY_STATUS_CHANGED", entity: "CareerOpportunity", entityId: opportunity.id, metadata: { from: opportunity.status, to: parsed.data.status, visibility: parsed.data.visibility } } })
  ]);
  revalidatePath("/career/opportunities"); revalidatePath(`/career/opportunities/${opportunity.code}`); revalidatePath("/career/manage");
  return { ok: true, message: "Opportunity status updated." };
}

export async function applyToCareerOpportunityAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_APPLY);
  const parsed = careerApplicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Check your application.");
  const opportunity = await prisma.careerOpportunity.findUnique({ where: { id: parsed.data.opportunityId } });
  if (!opportunity || !["AUTHENTICATED", "PUBLIC"].includes(opportunity.visibility)) throw new AuthorizationError("Opportunity is not available to this participant");
  const profile = await prisma.careerTalentProfile.findUnique({ where: { userId: actor.id } });
  if (!profile) return failure("Create your private Career Hub profile before applying.");
  if (profile.availability === "NOT_AVAILABLE") return failure("Update your availability before applying.");
  const referral = parsed.data.referralCode ? await prisma.careerReferral.findUnique({ where: { code: parsed.data.referralCode.toUpperCase() } }) : null;
  if (parsed.data.referralCode && (!referral || referral.opportunityId !== opportunity.id || referral.status !== "ACTIVE" || referral.referrerId === actor.id)) return failure("Referral code is invalid for this opportunity.");
  try {
    const application = await prisma.$transaction(async (tx) => {
      const current = await tx.careerOpportunity.findUnique({ where: { id: opportunity.id }, include: { applications: { where: { status: { notIn: ["WITHDRAWN", "REJECTED"] } }, select: { id: true } } } });
      if (!current || !opportunityAcceptsApplications({ ...current, activeApplications: current.applications.length })) throw new AuthorizationError("This opportunity is not accepting applications");
      const created = await tx.careerOpportunityApplication.create({ data: { opportunityId: opportunity.id, applicantId: actor.id, talentProfileId: profile.id, referralId: referral?.id, coverNote: optional(parsed.data.coverNote) } });
      await tx.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_OPPORTUNITY_APPLICATION_SUBMITTED", entity: "CareerOpportunityApplication", entityId: created.id, metadata: { opportunityId: opportunity.id, referralId: referral?.id ?? null } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidatePath("/career/applications"); revalidatePath(`/career/opportunities/${opportunity.code}`);
    return { ok: true, message: "Application submitted.", code: application.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return failure("You have already applied to this opportunity.");
    throw error;
  }
}

export async function withdrawCareerApplicationAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_APPLY);
  const parsed = careerApplicationWithdrawSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid application.");
  const application = await prisma.careerOpportunityApplication.findFirst({ where: { id: parsed.data.applicationId, applicantId: actor.id }, include: { opportunity: true } });
  if (!application) throw new AuthorizationError("Opportunity application not found");
  if (!["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"].includes(application.status)) return failure("This application can no longer be withdrawn.");
  await prisma.$transaction([
    prisma.careerOpportunityApplication.update({ where: { id: application.id }, data: { status: "WITHDRAWN", withdrawnAt: new Date() } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_OPPORTUNITY_APPLICATION_WITHDRAWN", entity: "CareerOpportunityApplication", entityId: application.id } })
  ]);
  revalidatePath("/career/applications"); revalidatePath(`/career/opportunities/${application.opportunity.code}`);
  return { ok: true, message: "Application withdrawn." };
}

export async function updateCareerApplicationStatusAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_APPLICATION_MANAGE);
  const parsed = careerApplicationStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Check application status.");
  await assertCareerOpportunityApplicationAccess(actor, PERMISSIONS.CAREER_APPLICATION_MANAGE, parsed.data.applicationId);
  const current = await prisma.careerOpportunityApplication.findUnique({ where: { id: parsed.data.applicationId } });
  if (!current) throw new AuthorizationError("Opportunity application not found");
  if (!canTransitionCareerApplication(current.status, parsed.data.status)) return failure(`Cannot move an application from ${current.status} to ${parsed.data.status}.`);
  await prisma.$transaction([
    prisma.careerOpportunityApplication.update({ where: { id: current.id }, data: { status: parsed.data.status, reviewNote: optional(parsed.data.reviewNote), reviewedById: actor.id, reviewedAt: new Date() } }),
    prisma.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_OPPORTUNITY_APPLICATION_STATUS_CHANGED", entity: "CareerOpportunityApplication", entityId: current.id, metadata: { from: current.status, to: parsed.data.status } } })
  ]);
  revalidatePath("/career/manage");
  return { ok: true, message: "Application status updated." };
}

export async function createCareerReferralAction(_: CareerHubActionState, formData: FormData): Promise<CareerHubActionState> {
  const actor = await assertPermission(PERMISSIONS.CAREER_REFERRAL_MANAGE);
  const parsed = careerReferralSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid opportunity.");
  const opportunity = await prisma.careerOpportunity.findFirst({ where: { id: parsed.data.opportunityId, status: "OPEN", visibility: { in: ["AUTHENTICATED", "PUBLIC"] } } });
  if (!opportunity) throw new AuthorizationError("Opportunity is not available for referral");
  const existing = await prisma.careerReferral.findUnique({ where: { opportunityId_referrerId: { opportunityId: opportunity.id, referrerId: actor.id } } });
  if (existing) return { ok: true, message: "Existing referral attribution retained.", code: existing.code };
  const code = `NICE-${randomBytes(5).toString("hex").toUpperCase()}`;
  const referral = await prisma.$transaction(async (tx) => {
    const created = await tx.careerReferral.create({ data: { opportunityId: opportunity.id, referrerId: actor.id, code } });
    await tx.platformAudit.create({ data: { actorId: actor.id, action: "CAREER_REFERRAL_CREATED", entity: "CareerReferral", entityId: created.id, metadata: { opportunityId: opportunity.id, code } } });
    return created;
  });
  revalidatePath("/career/referrals");
  return { ok: true, message: "Referral attribution created. No financial reward has been issued.", code: referral.code };
}
