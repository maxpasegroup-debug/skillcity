import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdmissionDashboard, ensureDefaultPipeline } from "@/server/admissions/queries";
import { getRecruitmentOverview } from "@/server/careers/queries";
import { getRMPerformanceManagement } from "@/server/careers/rm-performance";
import { getCurrentUser } from "@/server/auth/session";

const adminRoles = new Set(["Admin", "Director"]);

function studentAttentionReasons(enrollment: {
  studentId: string;
  student: {
    attendanceRecords: Array<{ status: string }>;
    submissions: Array<{ status: string; updatedAt: Date }>;
    progress: Array<{ updatedAt: Date }>;
  };
  batch: {
    activities: Array<{
      dueAt: Date | null;
      progress: Array<{ studentId: string; status: string }>;
    }>;
  } | null;
}) {
  const now = new Date();
  const attended = enrollment.student.attendanceRecords.filter((record) => record.status === "PRESENT" || record.status === "LATE").length;
  const attendancePercent = enrollment.student.attendanceRecords.length === 0 ? null : Math.round((attended / enrollment.student.attendanceRecords.length) * 100);
  const overdueTasks = enrollment.batch?.activities.filter((activity) => activity.dueAt && activity.dueAt < now && !activity.progress.some((progress) => progress.studentId === enrollment.studentId && progress.status === "COMPLETED")).length ?? 0;
  const pendingSubmissions = enrollment.student.submissions.filter((submission) => submission.status === "SUBMITTED").length;
  const lastProgressAt = enrollment.student.progress[0]?.updatedAt;
  const lastSubmissionAt = enrollment.student.submissions[0]?.updatedAt;
  const lastActivityAt = [lastProgressAt, lastSubmissionAt].filter(Boolean).sort((a, b) => Number(b) - Number(a))[0];
  const staleDate = new Date(now);
  staleDate.setDate(staleDate.getDate() - 14);

  return [
    attendancePercent !== null && attendancePercent < 75,
    overdueTasks > 1,
    pendingSubmissions > 0,
    !lastActivityAt || lastActivityAt < staleDate
  ].some(Boolean);
}

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
    auditLogs,
    activeBatches,
    activePrograms,
    trainers,
    todaysClasses,
    pendingSubmissions,
    attendanceRecords,
    completedProgress,
    requiredActivities,
    overdueTasks,
    batchAcademicReports,
    academicHealthStudents,
    operationalFollowUps,
    careers,
    rmPerformance
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
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { user: true } }),
    prisma.batch.count({ where: { status: "ACTIVE" } }),
    prisma.program.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, roles: { some: { role: { name: "Trainer" } } } } }),
    prisma.calendarEvent.count({ where: { startsAt: { gte: today, lt: tomorrow }, status: { in: ["SCHEDULED", "RESCHEDULED"] } } }),
    prisma.submission.count({ where: { status: "SUBMITTED" } }),
    prisma.attendanceRecord.findMany({ where: { session: { sessionDate: { gte: today, lt: tomorrow } } }, select: { status: true } }),
    prisma.studentProgress.count({ where: { status: "COMPLETED" } }),
    prisma.activity.count({ where: { required: true } }),
    prisma.activity.count({ where: { batchId: { not: null }, dueAt: { lt: new Date() }, progress: { none: { status: "COMPLETED" } } } }),
    prisma.batch.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ startsAt: "asc" }, { name: "asc" }],
      take: 8,
      include: {
        program: true,
        trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } },
        enrollments: { where: { status: "ACTIVE" }, select: { id: true } },
        activities: { where: { type: { in: ["TASK", "PROJECT", "ASSESSMENT"] } }, select: { id: true, dueAt: true, progress: { select: { status: true } } } },
        attendanceRecords: { select: { status: true } }
      }
    }),
    prisma.studentEnrollment.findMany({
      where: { status: "ACTIVE", batchId: { not: null } },
      take: 100,
      include: {
        batch: {
          include: {
            activities: { where: { type: { in: ["TASK", "PROJECT", "ASSESSMENT"] } }, select: { dueAt: true, progress: { select: { studentId: true, status: true } } } }
          }
        },
        student: {
          include: {
            attendanceRecords: { select: { status: true } },
            submissions: { orderBy: { updatedAt: "desc" }, take: 20, select: { status: true, updatedAt: true } },
            progress: { orderBy: { updatedAt: "desc" }, take: 20, select: { updatedAt: true } }
          }
        }
      }
    }),
    prisma.communicationLog.count({ where: { subject: "Academic follow-up", status: { in: ["DRAFT", "SCHEDULED"] } } }),
    getRecruitmentOverview(),
    getRMPerformanceManagement()
  ]);

  const presentToday = attendanceRecords.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;

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
      waitlistPrograms,
      operationalFollowUps
    },
    whatsappMessages,
    staffUsers,
    programOverview,
    auditLogs,
    academic: {
      activePrograms,
      activeBatches,
      activeStudents,
      trainers,
      todaysClasses,
      attendanceToday: attendanceRecords.length === 0 ? null : Math.round((presentToday / attendanceRecords.length) * 100),
      pendingSubmissions,
      overdueTasks,
      progress: requiredActivities === 0 ? 0 : Math.round((completedProgress / requiredActivities) * 100)
    },
    academicHealthSummary: {
      needingAttention: academicHealthStudents.filter(studentAttentionReasons).length
    },
    batchAcademicReports,
    careers,
    rmPerformance
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

export async function getAdminAcademicHealth(filters: { programId?: string; batchId?: string; trainerId?: string }) {
  const batchWhere = {
    ...(filters.batchId ? { id: filters.batchId } : {}),
    ...(filters.programId ? { programId: filters.programId } : {}),
    ...(filters.trainerId ? { trainerAssignments: { some: { trainerId: filters.trainerId, status: "ACTIVE" as const } } } : {})
  };

  const [programs, batches, trainers, enrollments] = await Promise.all([
    prisma.program.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.batch.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, include: { program: true, trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } } } }),
    prisma.user.findMany({ where: { deletedAt: null, roles: { some: { role: { name: "Trainer" } } } }, orderBy: { name: "asc" } }),
    prisma.studentEnrollment.findMany({
      where: {
        status: "ACTIVE",
        ...(filters.programId ? { programId: filters.programId } : {}),
        batch: batchWhere
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        program: true,
        batch: {
          include: {
            trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } },
            activities: { where: { type: { in: ["TASK", "PROJECT", "ASSESSMENT"] } }, include: { progress: true, submissions: true } }
          }
        },
        student: {
          include: {
            attendanceRecords: true,
            submissions: { orderBy: { updatedAt: "desc" }, take: 20 },
            progress: { orderBy: { updatedAt: "desc" }, take: 20 }
          }
        }
      }
    })
  ]);

  return { programs, batches, trainers, enrollments };
}

export async function getAdminFollowUps() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [health, followUps, owners] = await Promise.all([
    getAdminAcademicHealth({}),
    prisma.communicationLog.findMany({
      where: { subject: "Academic follow-up" },
      orderBy: [{ scheduledAt: "asc" }, { updatedAt: "desc" }],
      take: 80,
      include: { user: true }
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        roles: { some: { role: { name: { in: ["Trainer", "Counsellor", "Admission", "Director", "Admin"] } } } }
      },
      orderBy: { name: "asc" },
      include: { roles: { include: { role: true } } }
    })
  ]);

  const dueToday = followUps.filter((item) => item.status !== "SENT" && item.scheduledAt && item.scheduledAt < tomorrow).length;
  const open = followUps.filter((item) => item.status !== "SENT").length;
  const resolved = followUps.filter((item) => item.status === "SENT").length;

  return { health, followUps, owners, stats: { open, dueToday, resolved } };
}
