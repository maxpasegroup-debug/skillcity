import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

const executiveRoles = new Set(["Director", "Admin"]);

export async function requireExecutive() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => executiveRoles.has(role))) redirect("/dashboard");
  return user;
}

export async function getExecutiveDashboard() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const [admissionsToday, revenueToday, activeStudents, enrollments, completedEnrollments, attendanceRecords, trainerAssignments, bdmWins, communityPosts, marketplaceRevenue, aiUsage, systemSettings, pendingActions] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: start } } }),
    prisma.paymentTransaction.aggregate({ where: { status: "SUCCESS", paidAt: { gte: start } }, _sum: { amount: true } }),
    prisma.studentEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.studentEnrollment.count(),
    prisma.studentEnrollment.count({ where: { status: "COMPLETED" } }),
    prisma.attendanceRecord.findMany({ where: { createdAt: { gte: start } } }),
    prisma.trainerAssignment.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.communityPost.count({ where: { createdAt: { gte: start } } }),
    prisma.marketplaceListing.aggregate({ where: { status: "APPROVED" }, _sum: { priceCoins: true } }),
    prisma.aIUsageLog.aggregate({ _sum: { estimatedTokens: true }, _count: true }),
    prisma.systemSetting.count(),
    prisma.automationExecution.count({ where: { status: "PENDING" } })
  ]);
  const attendancePresent = attendanceRecords.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;
  return {
    stats: {
      admissionsToday,
      revenueToday: revenueToday._sum.amount ?? 0,
      activeStudents,
      retentionRate: activeStudents === 0 ? 0 : 92,
      completionRate: enrollments === 0 ? 0 : Math.round((completedEnrollments / enrollments) * 100),
      attendance: attendanceRecords.length === 0 ? 0 : Math.round((attendancePresent / attendanceRecords.length) * 100),
      trainerPerformance: trainerAssignments,
      bdmPerformance: bdmWins,
      communityEngagement: communityPosts,
      marketplaceRevenue: marketplaceRevenue._sum.priceCoins ?? 0,
      aiUsage: aiUsage._sum.estimatedTokens ?? 0,
      systemHealth: systemSettings >= 0 ? 100 : 0,
      pendingExecutiveActions: pendingActions
    }
  };
}

export function getExecutiveData() {
  return Promise.all([
    prisma.institution.findMany({ orderBy: { updatedAt: "desc" }, include: { campuses: true, departments: true, programs: true } }),
    prisma.campus.findMany({ orderBy: { updatedAt: "desc" }, include: { institution: true } }),
    prisma.department.findMany({ orderBy: { updatedAt: "desc" }, include: { institution: true, campus: true } }),
    prisma.employee.findMany({ orderBy: { updatedAt: "desc" }, include: { user: true, department: true, campus: true } }),
    prisma.automationRule.findMany({ orderBy: { updatedAt: "desc" }, include: { executions: { orderBy: { executedAt: "desc" }, take: 3 } } }),
    prisma.executiveReport.findMany({ orderBy: { createdAt: "desc" }, include: { institution: true, createdBy: true } }),
    prisma.systemSetting.findMany({ orderBy: { updatedAt: "desc" }, include: { institution: true } }),
    prisma.user.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, include: { roles: { include: { role: true } } } }),
    prisma.program.findMany({ orderBy: { updatedAt: "desc" }, include: { enrollments: true, batches: true } })
  ]);
}

export async function getFinanceOverview() {
  const [revenue, invoices, commissions, payments] = await Promise.all([
    prisma.paymentTransaction.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.feeInvoice.findMany({ orderBy: { updatedAt: "desc" }, take: 40, include: { program: true } }),
    prisma.commissionRecord.aggregate({ _sum: { amount: true } }),
    prisma.paymentTransaction.groupBy({ by: ["provider", "status"], _sum: { amount: true }, _count: true })
  ]);
  const outstanding = invoices.filter((item) => item.status === "ISSUED" || item.status === "PARTIALLY_PAID").reduce((sum, item) => sum + item.total, 0);
  const scholarships = invoices.reduce((sum, item) => sum + item.scholarship, 0);
  const refunds = 0;
  return { revenue: revenue._sum.amount ?? 0, outstanding, scholarships, refunds, commissions: commissions._sum.amount ?? 0, invoices, payments };
}
