import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

const admissionRoles = new Set(["Admission", "Director", "Admin"]);
const bdmRoles = new Set(["Business Development", "Director", "Admin"]);
const telecallerRoles = new Set(["Telecaller", "Admission", "Director", "Admin"]);
const counsellorRoles = new Set(["Counsellor", "Admission", "Director", "Admin"]);

export async function requireAdmissionUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => admissionRoles.has(role))) redirect("/dashboard");
  return user;
}

export async function requireBdmUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => bdmRoles.has(role))) redirect("/dashboard");
  return user;
}

export async function requireTelecallerUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => telecallerRoles.has(role))) redirect("/dashboard");
  return user;
}

export async function requireCounsellorUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => counsellorRoles.has(role))) redirect("/dashboard");
  return user;
}

function dayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isLimitedTelecaller(user: Awaited<ReturnType<typeof requireTelecallerUser>>) {
  const roles = user.roles.map((item) => item.role.name);
  return roles.includes("Telecaller") && !roles.some((role) => role === "Admission" || role === "Director" || role === "Admin");
}

function telecallerLeadScope(user: Awaited<ReturnType<typeof requireTelecallerUser>>): Prisma.LeadWhereInput {
  if (!isLimitedTelecaller(user)) return {};
  return { OR: [{ assignedToId: user.id }, { assignedToId: null }] };
}

function isLimitedCounsellor(user: Awaited<ReturnType<typeof requireCounsellorUser>>) {
  const roles = user.roles.map((item) => item.role.name);
  return roles.includes("Counsellor") && !roles.some((role) => role === "Admission" || role === "Director" || role === "Admin");
}

function counsellorLeadScope(user: Awaited<ReturnType<typeof requireCounsellorUser>>): Prisma.LeadWhereInput {
  if (!isLimitedCounsellor(user)) return {};
  return {
    OR: [
      { assignedToId: user.id },
      { pipelineStage: { slug: { in: ["counselling-scheduled", "qualified"] } } },
      { activities: { some: { type: "TELECALLER_SENT_TO_COUNSELLOR" } } }
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
  await ensureDefaultPipeline();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [leadsToday, totalLeads, wonLeads, revenue, pendingDocuments, pendingPayments, upcomingCounselling, topPrograms, pendingReview, approvedApplications, rejectedApplications] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: today } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.paymentTransaction.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.studentDocument.count({ where: { status: "PENDING" } }),
    prisma.feeInvoice.count({ where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } } }),
    prisma.counsellingSession.findMany({ where: { scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 6, include: { lead: true, counsellor: true } }),
    prisma.program.findMany({ orderBy: { leads: { _count: "desc" } }, take: 5, include: { leads: true } }),
    prisma.admissionApplication.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.admissionApplication.count({ where: { status: "APPROVED" } }),
    prisma.admissionApplication.count({ where: { status: "REJECTED" } })
  ]);
  return {
    stats: {
      admissionsToday: leadsToday,
      conversionRate: totalLeads === 0 ? 0 : Math.round((wonLeads / totalLeads) * 100),
      revenue: revenue._sum.amount ?? 0,
      pendingDocuments,
      pendingPayments,
      bdmPerformance: wonLeads,
      topPrograms: topPrograms.length,
      upcomingCounselling: upcomingCounselling.length,
      pendingReview,
      approvedApplications,
      rejectedApplications
    },
    upcomingCounselling,
    topPrograms
  };
}

export async function getAdmissionData() {
  const [stages, leads, programs, sources, users, batches] = await Promise.all([
    ensureDefaultPipeline(),
    prisma.lead.findMany({ orderBy: { updatedAt: "desc" }, include: { pipelineStage: true, programInterested: true, assignedTo: true, source: true, tags: { include: { tag: true } } } }),
    prisma.program.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.leadSource.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.batch.findMany({ orderBy: { name: "asc" }, include: { program: true } })
  ]);
  return { stages, leads, programs, sources, users, batches };
}

export function getAdmissionsOperationalLists() {
  return Promise.all([
    prisma.admissionApplication.findMany({ orderBy: { updatedAt: "desc" }, include: { lead: true, program: true, student: true, documents: true } }),
    prisma.studentDocument.findMany({ orderBy: { updatedAt: "desc" }, include: { application: { include: { lead: true } }, student: true } }),
    prisma.feeInvoice.findMany({ orderBy: { updatedAt: "desc" }, include: { lead: true, student: true, program: true, transactions: true } }),
    prisma.counsellingSession.findMany({ orderBy: { scheduledAt: "asc" }, include: { lead: true, counsellor: true, batch: true } }),
    prisma.communicationLog.findMany({ orderBy: { updatedAt: "desc" }, include: { lead: true, user: true } })
  ]);
}

export async function getBdmDashboard(userId: string) {
  const [assignedLeads, referrals, commissions, successfulPayments, leaderboard] = await Promise.all([
    prisma.lead.findMany({ where: { assignedToId: userId }, orderBy: { updatedAt: "desc" }, include: { pipelineStage: true, programInterested: true } }),
    prisma.referral.findMany({ where: { referrerId: userId }, orderBy: { createdAt: "desc" }, include: { lead: true, program: true } }),
    prisma.commissionRecord.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { program: true, invoice: true } }),
    prisma.paymentTransaction.aggregate({ where: { invoice: { lead: { assignedToId: userId } }, status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.commissionRecord.groupBy({ by: ["userId"], _sum: { amount: true }, orderBy: { _sum: { amount: "desc" } }, take: 5 })
  ]);
  return { assignedLeads, referrals, commissions, monthlyRevenue: successfulPayments._sum.amount ?? 0, leaderboard };
}

export async function getTelecallerWorkspace(input: { user: Awaited<ReturnType<typeof requireTelecallerUser>>; query?: string; filter?: string }) {
  await ensureDefaultPipeline();
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
  await ensureDefaultPipeline();
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
  await ensureDefaultPipeline();
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
    prisma.program.findMany({ where: { deletedAt: null, publicVisible: true }, orderBy: [{ displayOrder: "asc" }, { name: "asc" }] }),
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
  await ensureDefaultPipeline();
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
