import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdmissionDashboard, ensureDefaultPipeline } from "@/server/admissions/queries";
import { getCurrentUser } from "@/server/auth/session";

const adminRoles = new Set(["Admin", "Director"]);

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin-login");

  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => adminRoles.has(role))) redirect("/dashboard");

  return user;
}

export async function getAdminCommandCenter() {
  await ensureDefaultPipeline();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    admissions,
    newLeads,
    todaysCalls,
    counsellingToday,
    totalApplications,
    paymentsPending,
    paymentVerificationPending,
    admissionsConfirmed,
    activeStudents,
    followUpsDue,
    unassignedLeads,
    batchAssignmentPending,
    approvedWithoutLogin,
    activeStudentLogins,
    temporaryPins,
    expiredPins,
    whatsappMessages,
    openPrograms,
    waitlistPrograms,
    staffUsers,
    programOverview,
    auditLogs
  ] = await Promise.all([
    getAdmissionDashboard(),
    prisma.lead.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.leadActivity.count({ where: { type: { startsWith: "TELECALLER_" }, createdAt: { gte: today, lt: tomorrow } } }),
    prisma.counsellingSession.count({ where: { scheduledAt: { gte: today, lt: tomorrow }, outcome: { in: ["SCHEDULED", "RESCHEDULED"] } } }),
    prisma.admissionApplication.count(),
    prisma.feeInvoice.count({ where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } } }),
    prisma.paymentTransaction.count({ where: { status: { in: ["INITIATED", "SUCCESS"] }, invoice: { status: { not: "PAID" } } } }),
    prisma.lead.count({ where: { status: "WON" } }),
    prisma.studentEnrollment.count({ where: { status: "ACTIVE" } }),
    prisma.communicationLog.count({ where: { status: "SCHEDULED", scheduledAt: { lte: tomorrow } } }),
    prisma.lead.count({ where: { assignedToId: null, status: "OPEN" } }),
    prisma.studentEnrollment.count({ where: { status: "ACTIVE", batchId: null } }),
    prisma.admissionApplication.count({
      where: {
        status: "APPROVED",
        studentLoginCredentials: { none: { status: "ACTIVE", revokedAt: null } }
      }
    }),
    prisma.studentLoginCredential.count({ where: { status: "ACTIVE", revokedAt: null, temporary: false, mustResetPin: false } }),
    prisma.studentLoginCredential.count({ where: { status: "ACTIVE", revokedAt: null, OR: [{ temporary: true }, { mustResetPin: true }] } }),
    prisma.studentLoginCredential.count({ where: { status: "EXPIRED" } }),
    prisma.whatsAppMessageLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { application: { include: { lead: true, program: true } }, user: true } }),
    prisma.program.count({ where: { admissionStatus: "OPEN", publicVisible: true, deletedAt: null } }),
    prisma.program.count({ where: { admissionStatus: "WAITLIST", publicVisible: true, deletedAt: null } }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        roles: { some: { role: { name: { in: ["Admission", "Business Development", "Telecaller", "Counsellor", "Trainer", "Director", "Admin"] } } } }
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { roles: { include: { role: true } } }
    }),
    prisma.program.findMany({
      where: { deletedAt: null, publicVisible: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
      take: 12,
      include: {
        _count: {
          select: {
            leads: true,
            admissionApplications: true,
            enrollments: { where: { status: "ACTIVE" } }
          }
        }
      }
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: true } })
  ]);

  return {
    admissions,
    stats: {
      totalApplications,
      newLeads,
      todaysCalls,
      counsellingToday,
      paymentsPending,
      paymentVerificationPending,
      admissionsConfirmed,
      activeStudents,
      followUpsDue,
      unassignedLeads,
      batchAssignmentPending,
      approvedWithoutLogin,
      activeStudentLogins,
      temporaryPins,
      expiredPins,
      openPrograms,
      waitlistPrograms
    },
    whatsappMessages,
    staffUsers,
    programOverview,
    auditLogs
  };
}

export async function getAdminUsersAndRoles(query?: string) {
  const q = query?.trim();
  const [users, roles, auditLogs] = await Promise.all([
    prisma.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { assignedLeads: { some: { OR: [{ phone: { contains: q, mode: "insensitive" } }, { whatsapp: { contains: q, mode: "insensitive" } }] } } }
            ]
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        roles: { include: { role: true } },
        sessions: { orderBy: { createdAt: "desc" }, take: 1 },
        studentLoginCredentials: { orderBy: { updatedAt: "desc" }, take: 1 }
      }
    }),
    prisma.role.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { user: true } })
  ]);

  return { users, roles, auditLogs };
}
