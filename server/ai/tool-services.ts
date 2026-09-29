import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS, type AuthorizationUser } from "@/lib/auth/permissions";
import { assertLeadAccess } from "@/server/auth/resource-access";

export async function getScopedLeadSummary(actor: AuthorizationUser, leadId: string) {
  const permission = hasPermission(actor, PERMISSIONS.AI_ADMISSION) ? PERMISSIONS.AI_ADMISSION : PERMISSIONS.AI_BDM;
  await assertLeadAccess(actor, permission, leadId);
  return prisma.lead.findUniqueOrThrow({ where: { id: leadId }, select: { id: true, name: true, priority: true, source: true, pipelineStage: { select: { name: true } }, programInterested: { select: { name: true } }, activities: { orderBy: { createdAt: "desc" }, take: 5, select: { type: true, summary: true, createdAt: true } } } });
}

export function getOwnCareerProfile(userId: string) {
  return prisma.careerTalentProfile.findUnique({ where: { userId }, select: { headline: true, bio: true, skills: true, experienceSummary: true, educationSummary: true, location: true, availability: true, updatedAt: true } });
}

export function getOwnAcademicProgress(userId: string) {
  return prisma.studentEnrollment.findFirst({ where: { studentId: userId, status: "ACTIVE" }, orderBy: { startedAt: "desc" }, select: { id: true, currentDay: true, status: true, program: { select: { name: true } }, batch: { select: { name: true } }, student: { select: { progress: { orderBy: { updatedAt: "desc" }, take: 20, select: { status: true, updatedAt: true, activity: { select: { title: true, type: true } } } } } } } });
}
