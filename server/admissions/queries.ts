import type { ApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { applicationScopeWhere, batchScopeWhere, documentScopeWhere, employeeScopeWhere, feeInvoiceScopeWhere, leadScopeWhere, programScopeWhere, userThroughEnrollmentScopeWhere } from "@/server/auth/scoping";

export async function requireAdmissionUser() {
  return requirePermission(PERMISSIONS.ADMISSIONS_ACCESS);
}

export async function requireBdmUser() {
  return requirePermission(PERMISSIONS.BDM_ACCESS);
}

export async function requireTelecallerUser() {
  return requirePermission(PERMISSIONS.TELECALLER_ACCESS);
}

export async function requireCounsellorUser() {
  return requirePermission(PERMISSIONS.COUNSELLOR_ACCESS);
}

function dayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isLimitedTelecaller(user: Awaited<ReturnType<typeof requireTelecallerUser>>) {
  return hasPermission(user, PERMISSIONS.TELECALLER_ACCESS) && !hasPermission(user, PERMISSIONS.ADMISSIONS_ACCESS);
}

function telecallerLeadScope(user: Awaited<ReturnType<typeof requireTelecallerUser>>): Prisma.LeadWhereInput {
  const organizationScope = leadScopeWhere(user, PERMISSIONS.TELECALLER_ACCESS);
  if (!isLimitedTelecaller(user)) return organizationScope;
  return { AND: [organizationScope, { OR: [{ assignedToId: user.id }, { assignedToId: null }] }] };
}

function isLimitedCounsellor(user: Awaited<ReturnType<typeof requireCounsellorUser>>) {
  return hasPermission(user, PERMISSIONS.COUNSELLOR_ACCESS) && !hasPermission(user, PERMISSIONS.ADMISSIONS_ACCESS);
}

function counsellorLeadScope(user: Awaited<ReturnType<typeof requireCounsellorUser>>): Prisma.LeadWhereInput {
  const organizationScope = leadScopeWhere(user, PERMISSIONS.COUNSELLOR_ACCESS);
  if (!isLimitedCounsellor(user)) return organizationScope;
  return {
    AND: [
      organizationScope,
      {
        OR: [
          { assignedToId: user.id },
          { pipelineStage: { slug: { in: ["counselling-scheduled", "qualified"] } } },
          { activities: { some: { type: "TELECALLER_SENT_TO_COUNSELLOR" } } }
        ]
      }
    ]
  };
}

function searchLeadWhere(query?: string): Prisma.LeadWhereInput {
  const q = query?.trim();
  if (!q) return {};
  return {
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { phone: { contains: q, mode: "insensitive" as const } },
      { whatsapp: { contains: q, mode: "insensitive" as const } },
      { email: { contains: q, mode: "insensitive" as const } }
    ]
  };
}

function filterLeadWhere(filter?: string, todayEnd?: Date): Prisma.LeadWhereInput {
  if (!filter || filter === "all") return {};
  if (filter === "new") return { pipelineStage: { slug: "new-lead" } };
  if (filter === "follow-up") return { communicationLogs: { some: { status: "SCHEDULED" as const, scheduledAt: { lte: todayEnd ?? new Date() } } } };
  if (filter === "interested") return { activities: { some: { type: "TELECALLER_INTERESTED" } } };
  if (filter === "callback") return { activities: { some: { type: "TELECALLER_CALLBACK_REQUESTED" } } };
  if (filter === "qualified") return { pipelineStage: { slug: "qualified" } };
  if (filter === "sent-to-counsellor") return { activities: { some: { type: "TELECALLER_SENT_TO_COUNSELLOR" } } };
  if (filter === "not-interested") return { OR: [{ status: "LOST" as const }, { pipelineStage: { slug: "not-interested" } }] };
  return {};
}

function filterCounsellorWhere(filter?: string, todayEnd?: Date): Prisma.LeadWhereInput {
  if (!filter || filter === "all") return {};
  if (filter === "new") return { activities: { some: { type: "TELECALLER_SENT_TO_COUNSELLOR" } } };
  if (filter === "counselling-today") return { counsellingSessions: { some: { scheduledAt: { lte: todayEnd ?? new Date() }, outcome: { in: ["SCHEDULED", "RESCHEDULED"] } } } };
  if (filter === "follow-up") return { communicationLogs: { some: { status: "SCHEDULED" as const, subject: "Counsellor follow-up", scheduledAt: { lte: todayEnd ?? new Date() } } } };
  if (filter === "pending-decision") return { pipelineStage: { slug: { in: ["counselling-scheduled", "qualified"] } } };
  if (filter === "application-pending") return { applications: { some: { status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] } } } };
  if (filter === "approved") return { applications: { some: { status: "APPROVED" as const } } };
  if (filter === "on-hold") return { pipelineStage: { slug: "on-hold" } };
  if (filter === "not-interested") return { OR: [{ status: "LOST" as const }, { pipelineStage: { slug: "not-interested" } }] };
  return {};
}

export async function ensureDefaultPipeline() {
  const stages = [
    "New Lead",
    "Contacted",
    "Interested",
    "Counselling Scheduled",
    "Demo Attended",
    "Application Submitted",
    "Documents Verified",
    "Payment Pending",
    "Payment Verification Pending",
    "Enrolled",
    "Batch Assigned",
    "Active Student",
    "Counselling Completed",
    "Qualified",
    "Application Started",
    "Payment Confirmed",
    "Admission Confirmed",
    "Account Created",
    "Onboarding",
    "Batch Assignment Pending",
    "Not Interested",
    "Not Qualified",
    "Withdrawn",
    "On Hold"
  ];
  const existingStages = await prisma.pipelineStage.findMany({ select: { slug: true, order: true } });
  const existingBySlug = new Map(existingStages.map((stage) => [stage.slug, stage]));
  let nextOrder = existingStages.reduce((max, stage) => Math.max(max, stage.order), 0) + 1;

  for (const name of stages) {
    const slug = name.toLowerCase().replaceAll(" ", "-");
    if (existingBySlug.has(slug)) {
      await prisma.pipelineStage.update({ where: { slug }, data: { name, active: true } });
    } else {
      await prisma.pipelineStage.create({ data: { name, slug, order: nextOrder } });
      nextOrder += 1;
    }
  }
  await prisma.leadSource.upsert({ where: { name: "Website" }, update: {}, create: { name: "Website" } });
  return prisma.pipelineStage.findMany({ orderBy: { order: "asc" } });
}

export async function getAdmissionDashboard() {
  const user = await requireAdmissionUser();
  const leadScope = leadScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const applicationScope = applicationScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const documentScope = documentScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const invoiceScope = feeInvoiceScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const programScope = programScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [
    leadsToday,
    totalLeads,
    wonLeads,
    revenue,
    pendingDocuments,
    pendingPayments,
    upcomingCounselling,
    topPrograms,
    pendingReview,
    approvedApplications,
    rejectedApplications,
    startupSkoolApplications,
    airaLabsApplications
  ] = await Promise.all([
    prisma.lead.count({ where: { AND: [leadScope, { createdAt: { gte: today } }] } }),
    prisma.lead.count({ where: leadScope }),
    prisma.lead.count({ where: { AND: [leadScope, { status: "WON" }] } }),
    prisma.paymentTransaction.aggregate({ where: { status: "SUCCESS", invoice: invoiceScope }, _sum: { amount: true } }),
    prisma.studentDocument.count({ where: { AND: [documentScope, { status: "PENDING" }] } }),
    prisma.feeInvoice.count({ where: { AND: [invoiceScope, { status: { in: ["ISSUED", "PARTIALLY_PAID"] } }] } }),
    prisma.counsellingSession.findMany({ where: { lead: leadScope, scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 6, include: { lead: true, counsellor: true } }),
    prisma.program.findMany({ where: programScope, include: { leads: { where: leadScope } } }),
    prisma.admissionApplication.count({ where: { AND: [applicationScope, { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }] } }),
    prisma.admissionApplication.count({ where: { AND: [applicationScope, { status: "APPROVED" }] } }),
    prisma.admissionApplication.count({ where: { AND: [applicationScope, { status: "REJECTED" }] } }),
    prisma.admissionApplication.count({ where: { AND: [applicationScope, { program: { slug: "startup-skool" } }] } }),
    prisma.admissionApplication.count({ where: { AND: [applicationScope, { program: { slug: "aira-labs" } }] } })
  ]);
  const scopedTopPrograms = topPrograms.sort((a, b) => b.leads.length - a.leads.length).slice(0, 5);
  return {
    stats: {
      admissionsToday: leadsToday,
      conversionRate: totalLeads === 0 ? 0 : Math.round((wonLeads / totalLeads) * 100),
      revenue: revenue._sum.amount ?? 0,
      pendingDocuments,
      pendingPayments,
      bdmPerformance: wonLeads,
      topPrograms: scopedTopPrograms.length,
      upcomingCounselling: upcomingCounselling.length,
      pendingReview,
      approvedApplications,
      rejectedApplications,
      startupSkoolApplications,
      airaLabsApplications
    },
    upcomingCounselling,
    topPrograms: scopedTopPrograms
  };
}

export async function getAdmissionData() {
  const user = await requireAdmissionUser();
  const leadScope = leadScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const programScope = programScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const batchScope = batchScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const employeeScope = employeeScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const [stages, leads, programs, sources, users, batches] = await Promise.all([
    prisma.pipelineStage.findMany({ orderBy: { order: "asc" } }),
    prisma.lead.findMany({ where: leadScope, orderBy: { updatedAt: "desc" }, include: { pipelineStage: true, programInterested: true, assignedTo: true, source: true, tags: { include: { tag: true } } } }),
    prisma.program.findMany({ where: { AND: [programScope, { deletedAt: null }] }, orderBy: { name: "asc" } }),
    prisma.leadSource.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { deletedAt: null, employeeProfile: employeeScope }, orderBy: { name: "asc" } }),
    prisma.batch.findMany({ where: batchScope, orderBy: { name: "asc" }, include: { program: true } })
  ]);
  return { stages, leads, programs, sources, users, batches };
}

export async function getAdmissionsOperationalLists(filters?: { program?: string; status?: ApplicationStatus; q?: string }) {
  const user = await requireAdmissionUser();
  const applicationScope = applicationScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const documentScope = documentScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const invoiceScope = feeInvoiceScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const leadScope = leadScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const applicationWhere: Prisma.AdmissionApplicationWhereInput = {
    ...(filters?.program ? { program: { slug: filters.program } } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.q
      ? {
          OR: [
            { lead: { name: { contains: filters.q, mode: "insensitive" as const } } },
            { lead: { phone: { contains: filters.q, mode: "insensitive" as const } } },
            { lead: { whatsapp: { contains: filters.q, mode: "insensitive" as const } } },
            { lead: { email: { contains: filters.q, mode: "insensitive" as const } } }
          ]
        }
      : {})
  };

  return Promise.all([
    prisma.admissionApplication.findMany({ where: { AND: [applicationScope, applicationWhere] }, orderBy: { updatedAt: "desc" }, include: { lead: true, program: true, student: true, documents: true } }),
    prisma.studentDocument.findMany({ where: documentScope, orderBy: { updatedAt: "desc" }, include: { application: { include: { lead: true } }, student: true } }),
    prisma.feeInvoice.findMany({ where: invoiceScope, orderBy: { updatedAt: "desc" }, include: { lead: true, student: true, program: true, transactions: true } }),
    prisma.counsellingSession.findMany({ where: { lead: leadScope }, orderBy: { scheduledAt: "asc" }, include: { lead: true, counsellor: true, batch: true } }),
    prisma.communicationLog.findMany({ where: { lead: leadScope }, orderBy: { updatedAt: "desc" }, include: { lead: true, user: true } })
  ]);
}

export async function getBdmDashboard() {
  const user = await requireBdmUser();
  const userId = user.id;
  const leadScope = leadScopeWhere(user, PERMISSIONS.BDM_ACCESS);
  const [assignedLeads, referrals, commissions, successfulPayments, leaderboard] = await Promise.all([
    prisma.lead.findMany({ where: leadScope, orderBy: { updatedAt: "desc" }, include: { pipelineStage: true, programInterested: true } }),
    prisma.referral.findMany({ where: { referrerId: userId }, orderBy: { createdAt: "desc" }, include: { lead: true, program: true } }),
    prisma.commissionRecord.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { program: true, invoice: true } }),
    prisma.paymentTransaction.aggregate({ where: { invoice: { lead: leadScope }, status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.commissionRecord.groupBy({ by: ["userId"], where: { userId }, _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 5 })
  ]);
  return { assignedLeads, referrals, commissions, monthlyRevenue: successfulPayments._sum.amount ?? 0, leaderboard };
}

export async function getPipelineStages() {
  await requireAdmissionUser();
  return prisma.pipelineStage.findMany({ orderBy: { order: "asc" } });
}

export async function getAdmissionStudentOptions() {
  const user = await requireAdmissionUser();
  return prisma.user.findMany({
    where: { AND: [userThroughEnrollmentScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS), { roles: { some: { role: { name: "Student" } } }, deletedAt: null }] },
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });
}

type ApprovedAdmission = Prisma.AdmissionApplicationGetPayload<{ include: { lead: true; program: true; studentLoginCredentials: true; whatsAppMessageLogs: true } }>;
type RejectedAdmission = Prisma.AdmissionApplicationGetPayload<{ include: { lead: { include: { leadNotes: true } }; program: true } }>;

export function getAdmissionApplicationsByStatus(status: "APPROVED"): Promise<ApprovedAdmission[]>;
export function getAdmissionApplicationsByStatus(status: "REJECTED"): Promise<RejectedAdmission[]>;
export async function getAdmissionApplicationsByStatus(status: "APPROVED" | "REJECTED"): Promise<ApprovedAdmission[] | RejectedAdmission[]> {
  const user = await requireAdmissionUser();
  const scope = applicationScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  if (status === "APPROVED") {
    return prisma.admissionApplication.findMany({
      where: { AND: [scope, { status }] },
      orderBy: { reviewedAt: "desc" },
      include: {
        lead: true,
        program: true,
        studentLoginCredentials: { orderBy: { createdAt: "desc" }, take: 1 },
        whatsAppMessageLogs: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });
  }
  return prisma.admissionApplication.findMany({
    where: { AND: [scope, { status }] },
    orderBy: { reviewedAt: "desc" },
    include: { lead: { include: { leadNotes: { orderBy: { createdAt: "desc" }, take: 1 } } }, program: true }
  });
}

export async function getAdmissionReviewQueue() {
  const user = await requireAdmissionUser();
  return prisma.admissionApplication.findMany({
    where: { AND: [applicationScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS), { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }] },
    orderBy: { submittedAt: "asc" },
    include: { lead: { include: { leadNotes: { orderBy: { createdAt: "desc" }, take: 2 } } }, program: true }
  });
}

export async function getAdmissionProgramsWithCounts() {
  const user = await requireAdmissionUser();
  const permission = PERMISSIONS.ADMISSIONS_ACCESS;
  return prisma.program.findMany({
    where: { AND: [programScopeWhere(user, permission), { deletedAt: null }] },
    orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    include: {
      _count: {
        select: {
          leads: { where: leadScopeWhere(user, permission) },
          admissionApplications: { where: applicationScopeWhere(user, permission) }
        }
      }
    }
  });
}

export async function getTelecallerWorkspace(input: { user: Awaited<ReturnType<typeof requireTelecallerUser>>; query?: string; filter?: string }) {
  const { start, end } = dayBounds();
  const baseWhere: Prisma.LeadWhereInput = { AND: [telecallerLeadScope(input.user), searchLeadWhere(input.query), filterLeadWhere(input.filter, end)] };

  const connectedTypes = [
    "TELECALLER_INTERESTED",
    "TELECALLER_NEEDS_MORE_INFORMATION",
    "TELECALLER_CALLBACK_REQUESTED",
    "TELECALLER_QUALIFIED",
    "TELECALLER_SENT_TO_COUNSELLOR"
  ];

  const [leads, metrics, applications, enquiries, counsellingPending, completedToday] = await Promise.all([
    prisma.lead.findMany({
      where: baseWhere,
      orderBy: [{ updatedAt: "desc" }],
      take: 80,
      include: {
        pipelineStage: true,
        programInterested: true,
        source: true,
        assignedTo: true,
        activities: { orderBy: { createdAt: "desc" }, take: 3, include: { actor: true } },
        leadNotes: { orderBy: { createdAt: "desc" }, take: 2, include: { author: true } },
        applications: { orderBy: { updatedAt: "desc" }, take: 2, include: { program: true } },
        communicationLogs: { where: { status: "SCHEDULED" }, orderBy: { scheduledAt: "asc" }, take: 2 }
      }
    }),
    Promise.all([
      prisma.lead.count({ where: { ...telecallerLeadScope(input.user), createdAt: { gte: start, lt: end } } }),
      prisma.leadActivity.count({ where: { actorId: input.user.id, type: { startsWith: "TELECALLER_" }, createdAt: { gte: start, lt: end } } }),
      prisma.leadActivity.count({ where: { actorId: input.user.id, type: { in: connectedTypes }, createdAt: { gte: start, lt: end } } }),
      prisma.leadActivity.count({ where: { actorId: input.user.id, type: "TELECALLER_INTERESTED", createdAt: { gte: start, lt: end } } }),
      prisma.communicationLog.count({ where: { lead: telecallerLeadScope(input.user), status: "SCHEDULED", scheduledAt: { lte: end } } }),
      prisma.leadActivity.count({ where: { actorId: input.user.id, type: "TELECALLER_QUALIFIED", createdAt: { gte: start, lt: end } } }),
      prisma.leadActivity.count({ where: { actorId: input.user.id, type: "TELECALLER_SENT_TO_COUNSELLOR", createdAt: { gte: start, lt: end } } })
    ]),
    prisma.admissionApplication.count({ where: { lead: telecallerLeadScope(input.user), createdAt: { gte: start, lt: end } } }),
    prisma.lead.count({ where: { ...telecallerLeadScope(input.user), applications: { none: {} }, createdAt: { gte: start, lt: end } } }),
    prisma.lead.count({ where: { ...telecallerLeadScope(input.user), pipelineStage: { slug: { in: ["qualified", "counselling-scheduled"] } } } }),
    prisma.leadActivity.count({ where: { actorId: input.user.id, type: { in: ["TELECALLER_SENT_TO_COUNSELLOR", "TELECALLER_NOT_INTERESTED", "TELECALLER_WRONG_NUMBER"] }, createdAt: { gte: start, lt: end } } })
  ]);

  const [newLeads, callsMade, connected, interested, followUps, qualified, sentToCounsellor] = metrics;

  return {
    leads,
    stats: {
      newLeads,
      callsMade,
      connected,
      interested,
      followUps,
      qualified,
      sentToCounsellor,
      applications,
      enquiries,
      counsellingPending,
      completedToday
    }
  };
}

export async function getTelecallerLeadDetail(input: { user: Awaited<ReturnType<typeof requireTelecallerUser>>; leadId: string }) {
  return prisma.lead.findFirst({
    where: { id: input.leadId, ...telecallerLeadScope(input.user) },
    include: {
      pipelineStage: true,
      programInterested: true,
      source: true,
      assignedTo: true,
      owner: true,
      activities: { orderBy: { createdAt: "desc" }, take: 40, include: { actor: true } },
      leadNotes: { orderBy: { createdAt: "desc" }, take: 30, include: { author: true } },
      applications: { orderBy: { updatedAt: "desc" }, include: { program: true } },
      counsellingSessions: { orderBy: { scheduledAt: "desc" }, take: 10, include: { counsellor: true, batch: true } },
      communicationLogs: { orderBy: { updatedAt: "desc" }, take: 30, include: { user: true } }
    }
  });
}

export async function getCounsellorWorkspace(input: { user: Awaited<ReturnType<typeof requireCounsellorUser>>; query?: string; filter?: string; programId?: string; page?: number }) {
  const { start, end } = dayBounds();
  const page = Math.max(1, input.page ?? 1);
  const take = 25;
  const programWhere: Prisma.LeadWhereInput = input.programId ? { OR: [{ programInterestedId: input.programId }, { applications: { some: { programId: input.programId } } }] } : {};
  const baseScope = counsellorLeadScope(input.user);
  const baseWhere: Prisma.LeadWhereInput = { AND: [baseScope, searchLeadWhere(input.query), filterCounsellorWhere(input.filter, end), programWhere] };
  const activeCounsellingWhere: Prisma.LeadWhereInput = { AND: [baseScope, { pipelineStage: { slug: { in: ["counselling-scheduled", "qualified", "on-hold", "application-started"] } } }] };

  const [leads, total, programs, metrics] = await Promise.all([
    prisma.lead.findMany({
      where: baseWhere,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * take,
      take,
      include: {
        pipelineStage: true,
        programInterested: true,
        source: true,
        assignedTo: true,
        activities: { orderBy: { createdAt: "desc" }, take: 4, include: { actor: true } },
        leadNotes: { orderBy: { createdAt: "desc" }, take: 2, include: { author: true } },
        applications: { orderBy: { updatedAt: "desc" }, take: 2, include: { program: true } },
        counsellingSessions: { orderBy: { scheduledAt: "desc" }, take: 2, include: { counsellor: true } },
        communicationLogs: { where: { status: "SCHEDULED" }, orderBy: { scheduledAt: "asc" }, take: 2 }
      }
    }),
    prisma.lead.count({ where: baseWhere }),
    prisma.program.findMany({ where: { AND: [programScopeWhere(input.user, PERMISSIONS.COUNSELLOR_ACCESS), { deletedAt: null, publicVisible: true }] }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
    Promise.all([
      prisma.lead.count({ where: { AND: [baseScope, { pipelineStage: { slug: "counselling-scheduled" }, updatedAt: { gte: start, lt: end } }] } }),
      prisma.counsellingSession.count({ where: { lead: baseScope, scheduledAt: { gte: start, lt: end }, outcome: { in: ["SCHEDULED", "RESCHEDULED"] } } }),
      prisma.communicationLog.count({ where: { lead: baseScope, status: "SCHEDULED", subject: "Counsellor follow-up", scheduledAt: { lte: end } } }),
      prisma.lead.count({ where: { ...activeCounsellingWhere } }),
      prisma.lead.count({ where: { AND: [baseScope, { pipelineStage: { slug: "qualified" } }] } }),
      prisma.admissionApplication.count({ where: { lead: baseScope, status: { in: ["DRAFT", "SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.admissionApplication.count({ where: { lead: baseScope, status: "APPROVED" } }),
      prisma.lead.count({ where: { AND: [baseScope, { pipelineStage: { slug: "on-hold" } }] } }),
      prisma.lead.count({ where: { ...baseScope } }),
      prisma.leadActivity.count({ where: { actorId: input.user.id, type: "COUNSELLOR_COUNSELLING_COMPLETED", createdAt: { gte: start, lt: end } } }),
      prisma.leadActivity.count({ where: { actorId: input.user.id, type: "COUNSELLOR_ADMISSION_RECOMMENDED", createdAt: { gte: start, lt: end } } })
    ])
  ]);

  const [newCounselling, counsellingToday, followUpsDue, pendingDecisions, qualifiedCandidates, applicationPending, approved, onHold, candidatesAssigned, counsellingCompleted, admissionRecommended] = metrics;

  return {
    leads,
    programs,
    pagination: { page, take, total, pages: Math.max(1, Math.ceil(total / take)) },
    stats: {
      newCounselling,
      counsellingToday,
      followUpsDue,
      pendingDecisions,
      qualifiedCandidates,
      applicationPending,
      approved,
      onHold,
      candidatesAssigned,
      counsellingCompleted,
      admissionRecommended
    }
  };
}

export async function getCounsellorLeadDetail(input: { user: Awaited<ReturnType<typeof requireCounsellorUser>>; leadId: string }) {
  return prisma.lead.findFirst({
    where: { id: input.leadId, ...counsellorLeadScope(input.user) },
    include: {
      pipelineStage: true,
      programInterested: true,
      source: true,
      assignedTo: true,
      owner: true,
      activities: { orderBy: { createdAt: "desc" }, take: 80, include: { actor: true } },
      leadNotes: { orderBy: { createdAt: "desc" }, take: 40, include: { author: true } },
      applications: { orderBy: { updatedAt: "desc" }, include: { program: true } },
      counsellingSessions: { orderBy: { scheduledAt: "desc" }, take: 20, include: { counsellor: true, batch: true } },
      communicationLogs: { orderBy: { updatedAt: "desc" }, take: 40, include: { user: true } }
    }
  });
}
