import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

const admissionRoles = new Set(["Admission", "Director", "Admin"]);
const bdmRoles = new Set(["Business Development", "Director", "Admin"]);

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
    "Enrolled",
    "Batch Assigned",
    "Active Student"
  ];
  await Promise.all(
    stages.map((name, index) =>
      prisma.pipelineStage.upsert({
        where: { slug: name.toLowerCase().replaceAll(" ", "-") },
        update: { name, order: index + 1, active: true },
        create: { name, slug: name.toLowerCase().replaceAll(" ", "-"), order: index + 1 }
      })
    )
  );
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
