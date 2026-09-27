import type { CareerRecruitmentStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { careerApplicationScopeWhere, employeeScopeWhere } from "@/server/auth/scoping";

export async function requireRecruitmentUser() {
  return requirePermission(PERMISSIONS.RECRUITMENT_ACCESS);
}

export async function requireDirectorRecruitmentView() {
  return requirePermission(PERMISSIONS.RECRUITMENT_DIRECTOR);
}

export async function requireRelationshipManagerUser() {
  return requirePermission(PERMISSIONS.RELATIONSHIP_MANAGER_ACCESS);
}

export async function getRecruitmentOverview(filters?: { role?: string; category?: string; district?: string; stage?: CareerRecruitmentStage; q?: string }) {
  const user = await requireRecruitmentUser();
  const scope = careerApplicationScopeWhere(user, PERMISSIONS.RECRUITMENT_ACCESS);
  const employeeScope = employeeScopeWhere(user, PERMISSIONS.RECRUITMENT_ACCESS);
  const filtersWhere = {
    ...(filters?.role ? { roleSlug: filters.role } : {}),
    ...(filters?.category ? { categorySlug: filters.category } : {}),
    ...(filters?.district ? { district: { contains: filters.district, mode: "insensitive" as const } } : {}),
    ...(filters?.stage ? { stage: filters.stage } : {}),
    ...(filters?.q
      ? {
          OR: [
            { candidateName: { contains: filters.q, mode: "insensitive" as const } },
            { email: { contains: filters.q, mode: "insensitive" as const } },
            { mobile: { contains: filters.q, mode: "insensitive" as const } },
            { whatsapp: { contains: filters.q, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
  const where = { AND: [scope, filtersWhere] };

  const [
    total,
    newApplications,
    screeningPending,
    interviewPending,
    selected,
    rejected,
    onHold,
    joined,
    activeEmployees,
    academicAdvisorApplications,
    academicAdvisorNew,
    byRole,
    byDistrict,
    byCategory,
    applications,
    interviewPipeline,
    rmDevelopments
  ] = await Promise.all([
    prisma.careerApplication.count({ where: scope }),
    prisma.careerApplication.count({ where: { AND: [scope, { stage: "NEW_APPLICATION" }] } }),
    prisma.careerApplication.count({ where: { AND: [scope, { stage: { in: ["NEW_APPLICATION", "SCREENING"] } }] } }),
    prisma.careerApplication.count({ where: { AND: [scope, { stage: { in: ["SHORTLISTED", "INTERVIEW_SCHEDULED"] } }] } }),
    prisma.careerApplication.count({ where: { AND: [scope, { stage: { in: ["SELECTED", "OFFER_SENT", "OFFER_ACCEPTED"] } }] } }),
    prisma.careerApplication.count({ where: { AND: [scope, { stage: "REJECTED" }] } }),
    prisma.careerApplication.count({ where: { AND: [scope, { stage: "ON_HOLD" }] } }),
    prisma.careerApplication.count({ where: { AND: [scope, { stage: "JOINED" }] } }),
    prisma.employee.count({ where: { AND: [employeeScope, { status: "ACTIVE" }] } }),
    prisma.careerApplication.count({ where: { AND: [scope, { roleSlug: "academic-advisor" }] } }),
    prisma.careerApplication.count({ where: { AND: [scope, { roleSlug: "academic-advisor", stage: { in: ["NEW_APPLICATION", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED"] } }] } }),
    prisma.careerApplication.groupBy({ by: ["roleTitle"], where: scope, _count: true, orderBy: { _count: { roleTitle: "desc" } } }),
    prisma.careerApplication.groupBy({ by: ["district"], where: scope, _count: true, orderBy: { _count: { district: "desc" } }, take: 12 }),
    prisma.careerApplication.groupBy({ by: ["categoryTitle"], where: scope, _count: true, orderBy: { _count: { categoryTitle: "desc" } } }),
    prisma.careerApplication.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      take: 80,
      include: {
        assignedHr: true,
        reviewedBy: true,
        interviews: { orderBy: { scheduledAt: "desc" }, take: 1, include: { interviewer: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 3, include: { actor: true } },
        rmDevelopment: true
      }
    }),
    prisma.careerInterview.findMany({
      where: { status: "SCHEDULED", application: scope },
      orderBy: { scheduledAt: "asc" },
      take: 12,
      include: { application: true, interviewer: true }
    }),
    prisma.relationshipManagerDevelopment.findMany({
      where: { application: scope },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { application: true, employee: { include: { user: true } } }
    })
  ]);

  return {
    stats: { total, newApplications, screeningPending, interviewPending, selected, rejected, onHold, joined, activeEmployees, academicAdvisorApplications, academicAdvisorNew },
    byRole,
    byDistrict,
    byCategory,
    applications,
    interviewPipeline,
    rmDevelopments
  };
}

export async function getCareerApplicationDetail(applicationId: string) {
  const user = await requireRecruitmentUser();
  return prisma.careerApplication.findFirst({
    where: { AND: [{ id: applicationId }, careerApplicationScopeWhere(user, PERMISSIONS.RECRUITMENT_ACCESS)] },
    include: {
      assignedHr: true,
      reviewedBy: true,
      employee: { include: { user: true, department: true } },
      interviews: { orderBy: { scheduledAt: "desc" }, include: { interviewer: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { actor: true } },
      rmDevelopment: true
    }
  });
}

export async function getRecruitmentUsers() {
  const user = await requireRecruitmentUser();
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      employeeProfile: employeeScopeWhere(user, PERMISSIONS.RECRUITMENT_ACCESS),
      roles: { some: { role: { name: { in: ["Admin", "Director", "CEO", "COO", "HOD", "HR Manager", "HR Executive", "Interviewer"] } } } }
    },
    orderBy: { name: "asc" },
    include: { roles: { include: { role: true } } }
  });
}

export async function getRMEmployeeOptions() {
  const user = await requireRecruitmentUser();
  return prisma.employee.findMany({
    where: {
      AND: [employeeScopeWhere(user, PERMISSIONS.RECRUITMENT_ACCESS)],
      status: "ACTIVE",
      user: {
        deletedAt: null,
        status: "ACTIVE",
        roles: { some: { role: { name: { in: ["Relationship Manager", "Business Development", "Admin", "Director"] } } } }
      }
    },
    orderBy: { user: { name: "asc" } },
    include: { user: { include: { roles: { include: { role: true } } } }, department: true }
  });
}
