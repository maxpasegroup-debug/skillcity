import type { Prisma, RelationshipManagerDevelopment } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type RMPerformanceStatus = "NOT_STARTED" | "ON_TRACK" | "NEEDS_ATTENTION" | "AT_RISK" | "TARGET_ACHIEVED" | "PERIOD_ENDED";

export type RMAttributedAdmission = {
  applicationId: string;
  leadId: string;
  candidate: string;
  program: string;
  admissionStatus: string;
  admissionDate: Date | null;
  currentStage: string;
};

type RMDevelopmentWithRelations = RelationshipManagerDevelopment & {
  application: {
    candidateName: string;
    district: string;
    preferredLocation: string;
    stage: string;
    employee?: { userId: string; user: { id: string; name: string; email: string } } | null;
  };
  employee?: { userId: string; user: { id: string; name: string; email: string } } | null;
};

function dateWhere(start?: Date | null, end?: Date | null): Prisma.DateTimeNullableFilter | undefined {
  if (!start && !end) return undefined;
  return {
    ...(start ? { gte: start } : {}),
    ...(end ? { lte: end } : {})
  };
}

export async function getAttributedAdmissionsForRM(userId: string, development: Pick<RelationshipManagerDevelopment, "developmentStart" | "developmentEnd">): Promise<RMAttributedAdmission[]> {
  if (!development.developmentStart || !development.developmentEnd) return [];
  const convertedAt = dateWhere(development.developmentStart, development.developmentEnd);

  const applications = await prisma.admissionApplication.findMany({
    where: {
      status: "APPROVED",
      studentId: { not: null },
      lead: {
        status: "WON",
        convertedAt,
        OR: [
          { assignedToId: userId },
          { ownerId: userId },
          { referrals: { some: { referrerId: userId } } }
        ]
      }
    },
    orderBy: [{ lead: { convertedAt: "desc" } }, { updatedAt: "desc" }],
    include: {
      lead: { include: { pipelineStage: true } },
      program: true
    }
  });

  const enrollmentKeys = applications
    .filter((application) => application.studentId)
    .map((application) => ({
      studentId: application.studentId as string,
      programId: application.programId
    }));

  if (enrollmentKeys.length === 0) return [];

  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      status: { in: ["ACTIVE", "COMPLETED"] },
      OR: enrollmentKeys
    },
    select: { studentId: true, programId: true }
  });
  const validEnrollmentKeys = new Set(enrollments.map((item) => `${item.studentId}:${item.programId}`));
  const seen = new Set<string>();

  return applications
    .filter((application) => application.studentId && validEnrollmentKeys.has(`${application.studentId}:${application.programId}`))
    .filter((application) => {
      const key = `${application.studentId}:${application.programId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((application) => ({
      applicationId: application.id,
      leadId: application.leadId,
      candidate: application.lead.name,
      program: application.program.name,
      admissionStatus: application.status,
      admissionDate: application.lead.convertedAt,
      currentStage: application.lead.pipelineStage.name
    }));
}

function checkpoint(actual: number, target: number, days: number, totalDays: number) {
  const targetProgress = totalDays <= 0 ? target : Math.round((target * days) / totalDays);
  const status = actual >= targetProgress ? "ON TRACK" : actual >= Math.round(targetProgress * 0.75) ? "NEEDS ATTENTION" : "AT RISK";
  return { days, targetProgress, actualAdmissions: actual, status };
}

export function calculateRMPerformance(input: {
  development: Pick<RelationshipManagerDevelopment, "targetAdmissions" | "developmentStart" | "developmentEnd" | "status">;
  actualAdmissions: number;
}) {
  const target = input.development.targetAdmissions || 120;
  const actual = input.actualAdmissions;
  const remaining = Math.max(target - actual, 0);
  const achievementPercent = target === 0 ? 0 : Math.min(100, Math.round((actual / target) * 100));
  const now = new Date();
  const start = input.development.developmentStart;
  const end = input.development.developmentEnd;
  const totalDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY)) : null;
  const daysElapsed = start ? Math.max(0, Math.ceil((Math.min(now.getTime(), end?.getTime() ?? now.getTime()) - start.getTime()) / MS_PER_DAY)) : null;
  const daysRemaining = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / MS_PER_DAY)) : null;
  const requiredAveragePerDay = daysRemaining && daysRemaining > 0 ? Number((remaining / daysRemaining).toFixed(2)) : null;
  const requiredAveragePerWeek = daysRemaining && daysRemaining > 0 ? Number(((remaining / daysRemaining) * 7).toFixed(2)) : null;

  let performanceStatus: RMPerformanceStatus = "NOT_STARTED";
  if (actual >= target) performanceStatus = "TARGET_ACHIEVED";
  else if (!start || !end) performanceStatus = "NOT_STARTED";
  else if (daysRemaining === 0) performanceStatus = "PERIOD_ENDED";
  else {
    const expected = totalDays ? Math.round((target * (daysElapsed ?? 0)) / totalDays) : 0;
    if (actual >= expected) performanceStatus = "ON_TRACK";
    else if (actual >= Math.round(expected * 0.75)) performanceStatus = "NEEDS_ATTENTION";
    else performanceStatus = "AT_RISK";
  }

  return {
    target,
    actual,
    remaining,
    achievementPercent,
    daysElapsed,
    daysRemaining,
    requiredAveragePerDay,
    requiredAveragePerWeek,
    performanceStatus,
    checkpoints: {
      day30: checkpoint(actual, target, 30, totalDays ?? 90),
      day60: checkpoint(actual, target, 60, totalDays ?? 90),
      day90: checkpoint(actual, target, totalDays ?? 90, totalDays ?? 90)
    },
    recommendedEvaluationStatus: actual >= target ? "TARGET_ACHIEVED" : daysRemaining === 0 ? "UNDER_MANAGEMENT_REVIEW" : "IN_DEVELOPMENT"
  };
}

export async function buildRMPerformance(development: RMDevelopmentWithRelations) {
  const userId = development.employee?.userId ?? development.application.employee?.userId;
  const attributedAdmissions = userId ? await getAttributedAdmissionsForRM(userId, development) : [];
  const performance = calculateRMPerformance({ development, actualAdmissions: attributedAdmissions.length });
  return { development, userId, attributedAdmissions, performance };
}

export async function getRMPerformanceForUser(userId: string) {
  const development = await prisma.relationshipManagerDevelopment.findFirst({
    where: {
      OR: [
        { employee: { userId } },
        { application: { employee: { userId } } }
      ]
    },
    orderBy: { updatedAt: "desc" },
    include: {
      application: { include: { employee: { include: { user: true } } } },
      employee: { include: { user: true } },
      evaluationBy: true
    }
  });
  return development ? buildRMPerformance(development) : null;
}

export async function getRMPerformanceManagement(filters?: { district?: string; performance?: RMPerformanceStatus; status?: string }) {
  const developments = await prisma.relationshipManagerDevelopment.findMany({
    where: {
      ...(filters?.district ? { application: { district: { contains: filters.district, mode: "insensitive" } } } : {}),
      ...(filters?.status ? { status: filters.status as RelationshipManagerDevelopment["status"] } : {})
    },
    orderBy: { updatedAt: "desc" },
    include: {
      application: { include: { employee: { include: { user: true } } } },
      employee: { include: { user: true } },
      evaluationBy: true
    }
  });

  const rows = await Promise.all(developments.map(buildRMPerformance));
  return filters?.performance ? rows.filter((row) => row.performance.performanceStatus === filters.performance) : rows;
}
