import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requireAdmissionUser } from "@/server/admissions/queries";
import { batchScopeWhere, enrollmentLogScopeWhere, enrollmentScopeWhere } from "@/server/auth/scoping";

export async function getStudentBatchOnboardingQueue() {
  const user = await requireAdmissionUser();
  const enrollmentScope = enrollmentScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const batchScope = batchScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [batchPending, activeBatches, readyEnrollments, todaysClasses, attendanceRecords, pendingTasks] = await Promise.all([
    prisma.studentEnrollment.findMany({
      where: { AND: [enrollmentScope, { status: "ACTIVE", batchId: null }] },
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { activationProfile: true } },
        program: true,
        journey: true
      }
    }),
    prisma.batch.findMany({
      where: { AND: [batchScope, { status: "ACTIVE" }] },
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      include: {
        program: true,
        journey: true,
        enrollments: { where: { status: "ACTIVE" }, select: { id: true, studentId: true } },
        trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } },
        calendarEvents: {
          where: { startsAt: { gte: now }, status: { in: ["SCHEDULED", "RESCHEDULED"] } },
          orderBy: { startsAt: "asc" },
          take: 1
        }
      }
    }),
    prisma.studentEnrollment.findMany({
      where: { AND: [enrollmentScope, { status: "ACTIVE", batchId: { not: null } }] },
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        student: { include: { activationProfile: true } },
        program: true,
        journey: true,
        batch: true
      }
    }),
    prisma.calendarEvent.count({
      where: { batch: batchScope, startsAt: { gte: todayStart, lt: todayEnd }, status: { in: ["SCHEDULED", "RESCHEDULED"] } }
    }),
    prisma.attendanceRecord.findMany({
      where: { batch: batchScope, session: { sessionDate: { gte: todayStart, lt: todayEnd } } },
      select: { status: true }
    }),
    prisma.activity.count({
      where: {
        batch: batchScope,
        required: true,
        type: { in: ["TASK", "PROJECT", "ASSESSMENT", "REFLECTION", "QUIZ"] },
        progress: { some: { status: { not: "COMPLETED" } } }
      }
    })
  ]);

  const activeBatchIds = activeBatches.map((batch) => batch.id);
  const activeStudents = activeBatches.reduce((total, batch) => total + batch.enrollments.length, 0);
  const capacity = activeBatches.reduce((total, batch) => total + (batch.enrollmentLimit ?? batch.enrollments.length), 0);
  const presentToday = attendanceRecords.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;

  return {
    batchPending,
    activeBatches,
    readyEnrollments,
    stats: {
      batchPending: batchPending.length,
      activeBatches: activeBatches.length,
      studentsReady: readyEnrollments.length,
      activeStudents,
      availableSeats: Math.max(capacity - activeStudents, 0),
      todaysClasses,
      attendanceToday: attendanceRecords.length === 0 ? null : Math.round((presentToday / attendanceRecords.length) * 100),
      pendingTasks,
      onlineOfflineConfigured: activeBatches.some((batch) => batch.calendarEvents.some((event) => event.location)),
      activeBatchIds
    }
  };
}

export async function getScopedEnrollmentLogs() {
  const user = await requireAdmissionUser();
  return prisma.enrollmentLog.findMany({
    where: enrollmentLogScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS),
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { student: true, batch: true, enrollment: { include: { program: true } } }
  });
}
