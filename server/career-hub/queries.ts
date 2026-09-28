import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { campusScopeWhere, careerEmployerScopeWhere, careerOpportunityApplicationScopeWhere, careerOpportunityScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, employeeScopeWhere, institutionScopeWhere } from "@/server/auth/scoping";

const visibleOpportunity: Prisma.CareerOpportunityWhereInput = {
  status: "OPEN" as const,
  visibility: { in: ["AUTHENTICATED", "PUBLIC"] },
  OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }]
};

export const careerCandidatePresentationSelect = {
  id: true,
  name: true,
  careerTalentProfile: { select: { headline: true, bio: true, skills: true, experienceSummary: true, educationSummary: true, location: true, availability: true } },
  verifiedSkills: { select: { name: true, level: true } }
} satisfies Prisma.UserSelect;

export async function getCareerHubDashboard() {
  const actor = await requirePermission(PERMISSIONS.CAREER_READ);
  const [profile, visibleCount, applications, referrals] = await Promise.all([
    prisma.careerTalentProfile.findUnique({ where: { userId: actor.id } }),
    prisma.careerOpportunity.count({ where: visibleOpportunity }),
    prisma.careerOpportunityApplication.count({ where: { applicantId: actor.id } }),
    prisma.careerReferral.count({ where: { referrerId: actor.id, status: "ACTIVE" } })
  ]);
  return { actor, profile, visibleCount, applications, referrals, canManage: hasPermission(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE) };
}

export async function getCareerOpportunityCatalog() {
  const actor = await requirePermission(PERMISSIONS.CAREER_READ);
  const managementScope = careerOpportunityScopeWhere(actor, PERMISSIONS.CAREER_READ);
  return prisma.careerOpportunity.findMany({
    where: { OR: [visibleOpportunity, managementScope] },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { employer: { select: { code: true, name: true, publicDescription: true, websiteUrl: true, industry: true, status: true } }, _count: { select: { applications: true } } }
  });
}

export async function getCareerOpportunityDetail(code: string) {
  const actor = await requirePermission(PERMISSIONS.CAREER_READ);
  const managementScope = careerOpportunityScopeWhere(actor, PERMISSIONS.CAREER_READ);
  const opportunity = await prisma.careerOpportunity.findFirst({
    where: { code, OR: [visibleOpportunity, managementScope] },
    include: { employer: { select: { code: true, name: true, publicDescription: true, websiteUrl: true, industry: true, status: true } }, ownerEmployee: { include: { user: { select: { name: true } } } }, _count: { select: { applications: true } } }
  });
  const existingApplication = opportunity ? await prisma.careerOpportunityApplication.findUnique({ where: { opportunityId_applicantId: { opportunityId: opportunity.id, applicantId: actor.id } } }) : null;
  return { actor, opportunity, existingApplication, canApply: hasPermission(actor, PERMISSIONS.CAREER_APPLY), canRefer: hasPermission(actor, PERMISSIONS.CAREER_REFERRAL_MANAGE) };
}

export async function getMyCareerProfile() {
  const actor = await requirePermission(PERMISSIONS.CAREER_PROFILE_MANAGE);
  const [profile, portfolio, resumes, placement] = await Promise.all([
    prisma.careerTalentProfile.findUnique({ where: { userId: actor.id } }),
    prisma.studentPortfolio.findUnique({ where: { studentId: actor.id }, include: { projects: { where: { status: "APPROVED" } }, skills: { include: { evidence: true } } } }),
    prisma.resumeProfile.findMany({ where: { studentId: actor.id }, orderBy: { updatedAt: "desc" } }),
    prisma.placementProfile.findUnique({ where: { studentId: actor.id } })
  ]);
  return { actor, profile, portfolio, resumes, placement };
}

export async function getMyCareerApplications() {
  const actor = await requirePermission(PERMISSIONS.CAREER_APPLY);
  return prisma.careerOpportunityApplication.findMany({
    where: { applicantId: actor.id },
    orderBy: { submittedAt: "desc" },
    include: { opportunity: { include: { employer: { select: { name: true } } } }, referral: { select: { code: true } } }
  });
}

export async function getMyCareerReferrals() {
  const actor = await requirePermission(PERMISSIONS.CAREER_REFERRAL_MANAGE);
  return prisma.careerReferral.findMany({
    where: { referrerId: actor.id },
    orderBy: { createdAt: "desc" },
    include: { opportunity: { include: { employer: { select: { name: true } } } }, _count: { select: { applications: true } } }
  });
}

export async function getCareerManagementData() {
  const actor = await requirePermission(PERMISSIONS.CAREER_OPPORTUNITY_MANAGE, "/admin-login");
  const [employers, opportunities, applications, institutions, divisions, districts, campuses, departments, employees] = await Promise.all([
    prisma.careerEmployer.findMany({ where: careerEmployerScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), orderBy: { name: "asc" } }),
    prisma.careerOpportunity.findMany({ where: careerOpportunityScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), orderBy: { createdAt: "desc" }, include: { employer: true, ownerEmployee: { include: { user: true } }, _count: { select: { applications: true } } } }),
    hasPermission(actor, PERMISSIONS.CAREER_APPLICATION_MANAGE) ? prisma.careerOpportunityApplication.findMany({
      where: careerOpportunityApplicationScopeWhere(actor, PERMISSIONS.CAREER_APPLICATION_MANAGE),
      orderBy: { submittedAt: "desc" },
      include: {
        opportunity: { include: { employer: { select: { name: true } } } },
        applicant: { select: careerCandidatePresentationSelect }
      }
    }) : [],
    prisma.institution.findMany({ where: institutionScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), orderBy: { name: "asc" } }),
    prisma.division.findMany({ where: divisionScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), orderBy: { name: "asc" } }),
    prisma.district.findMany({ where: districtScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), orderBy: { name: "asc" } }),
    prisma.campus.findMany({ where: campusScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: departmentScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), orderBy: { name: "asc" } }),
    prisma.employee.findMany({ where: { AND: [employeeScopeWhere(actor, PERMISSIONS.CAREER_OPPORTUNITY_MANAGE), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] }, user: { status: "ACTIVE", deletedAt: null } }] }, orderBy: { user: { name: "asc" } }, include: { user: true } })
  ]);
  return { actor, employers, opportunities, applications, institutions, divisions, districts, campuses, departments, employees };
}
