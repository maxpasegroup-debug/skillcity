import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { funnelRate } from "@/lib/crm/validation";
import { requireAdmissionUser } from "@/server/admissions/queries";
import { employeeScopeWhere, enrollmentScopeWhere, leadScopeWhere } from "@/server/auth/scoping";

export async function getCrmFunnel() {
  const actor = await requireAdmissionUser();
  const leadScope = leadScopeWhere(actor, PERMISSIONS.ADMISSIONS_ACCESS);
  const enrollmentScope = enrollmentScopeWhere(actor, PERMISSIONS.ADMISSIONS_ACCESS);
  const now = new Date();
  const [leads, contacted, qualified, counselled, applied, approved, enrolled, followUpsDue] = await Promise.all([
    prisma.lead.count({ where: leadScope }),
    prisma.lead.count({
      where: {
        AND: [leadScope, { activities: { some: { type: { in: ["TELECALLER_CONNECTED", "TELECALLER_INTERESTED", "TELECALLER_NEEDS_MORE_INFORMATION", "TELECALLER_CALLBACK_REQUESTED", "TELECALLER_QUALIFIED"] } } } }]
      }
    }),
    prisma.lead.count({
      where: { AND: [leadScope, { activities: { some: { type: { in: ["TELECALLER_QUALIFIED", "TELECALLER_SENT_TO_COUNSELLOR"] } } } }] }
    }),
    prisma.lead.count({ where: { AND: [leadScope, { counsellingSessions: { some: {} } }] } }),
    prisma.lead.count({ where: { AND: [leadScope, { applications: { some: {} } }] } }),
    prisma.lead.count({ where: { AND: [leadScope, { applications: { some: { status: "APPROVED" } } }] } }),
    prisma.studentEnrollment.count({ where: { AND: [enrollmentScope, { status: "ACTIVE" }] } }),
    prisma.communicationLog.count({ where: { lead: leadScope, channel: "INTERNAL_NOTIFICATION", status: "SCHEDULED", scheduledAt: { lte: now } } })
  ]);
  return {
    leads,
    contacted,
    qualified,
    counselled,
    applied,
    approved,
    enrolled,
    followUpsDue,
    leadToApplicationRate: funnelRate(applied, leads),
    leadToEnrollmentRate: funnelRate(enrolled, leads)
  };
}

export async function getScopedLeadDetail(leadId: string) {
  const actor = await requireAdmissionUser();
  const leadScope = leadScopeWhere(actor, PERMISSIONS.ADMISSIONS_ACCESS);
  const employeeScope = employeeScopeWhere(actor, PERMISSIONS.ADMISSIONS_MANAGE);
  const [lead, assignees] = await Promise.all([
    prisma.lead.findFirst({
      where: { AND: [{ id: leadId }, leadScope] },
      include: {
        pipelineStage: true,
        source: true,
        programInterested: true,
        assignedTo: true,
        owner: true,
        activities: { orderBy: { createdAt: "desc" }, take: 80, include: { actor: true } },
        communicationLogs: { orderBy: { createdAt: "desc" }, take: 30, include: { user: true } },
        counsellingSessions: { orderBy: { createdAt: "desc" }, include: { counsellor: true, batch: true } },
        applications: { orderBy: { createdAt: "desc" }, include: { program: true, student: true } },
        leadNotes: { orderBy: { createdAt: "desc" }, take: 30, include: { author: true } }
      }
    }),
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE", employeeProfile: { AND: [employeeScope, { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    })
  ]);
  return { lead, assignees };
}
