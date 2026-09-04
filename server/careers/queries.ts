import { redirect } from "next/navigation";
import type { CareerRecruitmentStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

const recruitmentRoles = new Set(["Admin", "Director", "CEO", "COO", "HOD", "HR Manager", "HR Executive"]);
const directorViewRoles = new Set(["Admin", "Director", "CEO", "COO", "HOD"]);
const relationshipManagerRoles = new Set(["Relationship Manager", "Business Development", "Admin", "Director"]);

export async function requireRecruitmentUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => recruitmentRoles.has(role))) redirect("/dashboard");
  return user;
}

export async function requireDirectorRecruitmentView() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => directorViewRoles.has(role))) redirect("/dashboard");
  return user;
}

export async function requireRelationshipManagerUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => relationshipManagerRoles.has(role))) redirect("/dashboard");
  return user;
}

export async function getRecruitmentOverview(filters?: { role?: string; category?: string; district?: string; stage?: CareerRecruitmentStage; q?: string }) {
  const where = {
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
    prisma.careerApplication.count(),
    prisma.careerApplication.count({ where: { stage: "NEW_APPLICATION" } }),
    prisma.careerApplication.count({ where: { stage: { in: ["NEW_APPLICATION", "SCREENING"] } } }),
    prisma.careerApplication.count({ where: { stage: { in: ["SHORTLISTED", "INTERVIEW_SCHEDULED"] } } }),
    prisma.careerApplication.count({ where: { stage: { in: ["SELECTED", "OFFER_SENT", "OFFER_ACCEPTED"] } } }),
    prisma.careerApplication.count({ where: { stage: "REJECTED" } }),
    prisma.careerApplication.count({ where: { stage: "ON_HOLD" } }),
    prisma.careerApplication.count({ where: { stage: "JOINED" } }),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.careerApplication.count({ where: { roleSlug: "academic-advisor" } }),
    prisma.careerApplication.count({ where: { roleSlug: "academic-advisor", stage: { in: ["NEW_APPLICATION", "SCREENING", "SHORTLISTED", "INTERVIEW_SCHEDULED"] } } }),
    prisma.careerApplication.groupBy({ by: ["roleTitle"], _count: true, orderBy: { _count: { roleTitle: "desc" } } }),
    prisma.careerApplication.groupBy({ by: ["district"], _count: true, orderBy: { _count: { district: "desc" } }, take: 12 }),
    prisma.careerApplication.groupBy({ by: ["categoryTitle"], _count: true, orderBy: { _count: { categoryTitle: "desc" } } }),
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
      where: { status: "SCHEDULED" },
      orderBy: { scheduledAt: "asc" },
      take: 12,
      include: { application: true, interviewer: true }
    }),
    prisma.relationshipManagerDevelopment.findMany({
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
  await requireRecruitmentUser();
  return prisma.careerApplication.findUnique({
    where: { id: applicationId },
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

export function getRecruitmentUsers() {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      roles: { some: { role: { name: { in: ["Admin", "Director", "CEO", "COO", "HOD", "HR Manager", "HR Executive", "Interviewer"] } } } }
    },
    orderBy: { name: "asc" },
    include: { roles: { include: { role: true } } }
  });
}

export function getRMEmployeeOptions() {
  return prisma.employee.findMany({
    where: {
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
