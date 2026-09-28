import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { activityScopeWhere, batchScopeWhere, calendarEventScopeWhere, employeeScopeWhere, enrollmentScopeWhere, programScopeWhere, userThroughEnrollmentScopeWhere } from "@/server/auth/scoping";

export async function requireDirector() {
  return requirePermission(PERMISSIONS.DIRECTOR_ACCESS, "/admin-login");
}

export async function getDirectorDashboard() {
  const user = await requireDirector();
  const programScope = programScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  const batchScope = batchScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  const enrollmentScope = enrollmentScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  const activityScope = activityScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  const eventScope = calendarEventScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  const studentScope = userThroughEnrollmentScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [
    activePrograms,
    activeBatches,
    students,
    todaysActivities,
    upcomingLiveClasses,
    pendingReviews,
    announcementsSent,
    enrollments,
    completedProgress,
    requiredActivities,
    liveEvents,
    activeEnrollmentStudents,
    recentActivity
  ] = await Promise.all([
    prisma.program.count({ where: { AND: [programScope, { status: "ACTIVE", deletedAt: null }] } }),
    prisma.batch.count({ where: { AND: [batchScope, { status: "ACTIVE" }] } }),
    prisma.user.count({ where: { AND: [studentScope, { roles: { some: { role: { name: "Student" } } }, deletedAt: null }] } }),
    prisma.activity.count({
      where: { AND: [activityScope, { day: { week: { phase: { journey: { enrollments: { some: { status: "ACTIVE" } } } } } } }] }
    }),
    prisma.calendarEvent.count({ where: { AND: [eventScope, { type: "LIVE_CLASS", startsAt: { gte: now }, status: { in: ["SCHEDULED", "RESCHEDULED"] } }] } }),
    prisma.studentProgress.count({ where: { status: "IN_PROGRESS", activity: { AND: [activityScope, { type: { in: ["PROJECT", "ASSESSMENT", "TASK"] } }] } } }),
    prisma.directorAnnouncement.count({ where: { status: "PUBLISHED", OR: [{ program: programScope }, { batch: batchScope }] } }),
    prisma.studentEnrollment.findMany({ where: { AND: [enrollmentScope, { status: "ACTIVE" }] }, select: { currentDay: true, program: { select: { durationDays: true } } } }),
    prisma.studentProgress.count({ where: { status: "COMPLETED", activity: activityScope } }),
    prisma.activity.count({ where: { AND: [activityScope, { required: true }] } }),
    prisma.calendarEvent.findMany({
      where: { AND: [eventScope, { type: "LIVE_CLASS", startsAt: { gte: now }, status: { in: ["SCHEDULED", "RESCHEDULED"] } }] },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { batch: true, program: true }
    }),
    prisma.studentEnrollment.findMany({ where: { AND: [enrollmentScope, { status: "ACTIVE" }] }, select: { studentId: true } }),
    prisma.directorActivityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: true } })
  ]);

  const averageProgress =
    enrollments.length === 0
      ? 0
      : Math.round(
          enrollments.reduce((total, item) => total + Math.min(item.currentDay / Math.max(item.program.durationDays, 1), 1), 0) /
            enrollments.length *
            100
        );

  return {
    stats: {
      activePrograms,
      activeBatches,
      students,
      todaysActivities,
      upcomingLiveClasses,
      pendingReviews,
      announcementsSent,
      studentCompletion: requiredActivities === 0 ? 0 : Math.round((completedProgress / requiredActivities) * 100),
      journeyHealth: averageProgress,
      attendance: liveEvents.length > 0 ? 100 : 0,
      inactiveStudents: Math.max(students - new Set(activeEnrollmentStudents.map((item) => item.studentId)).size, 0)
    },
    liveEvents,
    recentActivity
  };
}

export async function getDirectorPrograms() {
  const user = await requireDirector();
  return prisma.program.findMany({
    where: programScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS),
    orderBy: { updatedAt: "desc" },
    include: {
      journeys: { orderBy: { version: "desc" }, take: 1 },
      batches: true,
      enrollments: true
    }
  });
}

export async function getDirectorBlueprints() {
  const user = await requireDirector();
  return prisma.blueprint.findMany({
    where: { program: programScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS) },
    orderBy: { updatedAt: "desc" },
    include: { program: true, journey: true, versions: { orderBy: { version: "desc" }, take: 1 } }
  });
}

export async function getDirectorBatches() {
  const user = await requireDirector();
  return prisma.batch.findMany({
    where: batchScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS),
    orderBy: { createdAt: "desc" },
    include: { program: true, journey: true, enrollments: true, trainerAssignments: { include: { trainer: true } } }
  });
}

export async function getDirectorPlanner() {
  const user = await requireDirector();
  const journeys = await prisma.journey.findMany({
    where: { program: programScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS), status: { in: ["ACTIVE", "DRAFT"] } },
    orderBy: [{ program: { name: "asc" } }, { version: "desc" }],
    include: {
      program: true,
      phases: {
        orderBy: { order: "asc" },
        include: {
          weeks: {
            orderBy: { weekNumber: "asc" },
            include: {
              days: { orderBy: { dayNumber: "asc" }, include: { activities: { orderBy: { sortOrder: "asc" } } } }
            }
          }
        }
      }
    }
  });

  return journeys;
}

export async function getDirectorTrainersAndBatches() {
  const user = await requireDirector();
  const batchScope = batchScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  const employeeScope = employeeScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  return Promise.all([
    prisma.user.findMany({
      where: { roles: { some: { role: { name: "Trainer" } } }, deletedAt: null, status: "ACTIVE", employeeProfile: { AND: [employeeScope, { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }] } },
      orderBy: { name: "asc" }
    }),
    prisma.batch.findMany({ where: batchScope, orderBy: { createdAt: "desc" }, include: { program: true, journey: true, enrollments: true, trainerAssignments: { include: { trainer: true } } } }),
    prisma.trainerAssignment.findMany({ where: { batch: batchScope }, include: { trainer: true, batch: { include: { program: true } } }, orderBy: { createdAt: "desc" } })
  ]);
}

export async function getDirectorCommunicationData() {
  const user = await requireDirector();
  const programScope = programScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  const batchScope = batchScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  return Promise.all([
    prisma.directorAnnouncement.findMany({ where: { OR: [{ program: programScope }, { batch: batchScope }] }, orderBy: { createdAt: "desc" }, take: 30, include: { program: true, batch: true } }),
    prisma.program.findMany({ where: programScope, orderBy: { name: "asc" } }),
    prisma.batch.findMany({ where: batchScope, orderBy: { name: "asc" } })
  ]);
}

export async function getDirectorCalendarData() {
  const user = await requireDirector();
  const now = new Date();
  const monthAhead = new Date(now);
  monthAhead.setDate(monthAhead.getDate() + 30);

  return Promise.all([
    prisma.calendarEvent.findMany({
      where: { AND: [calendarEventScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS), { startsAt: { gte: now, lte: monthAhead } }] },
      orderBy: { startsAt: "asc" },
      include: { program: true, batch: true }
    }),
    prisma.program.findMany({ where: programScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS), orderBy: { name: "asc" } }),
    prisma.batch.findMany({ where: batchScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS), orderBy: { name: "asc" } }),
    prisma.journey.findMany({ where: { program: programScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS) }, orderBy: { updatedAt: "desc" }, include: { program: true } })
  ]);
}

export async function getDirectorContentLibrary() {
  const user = await requireDirector();
  const programScope = programScopeWhere(user, PERMISSIONS.DIRECTOR_ACCESS);
  return Promise.all([
    prisma.contentLibrary.findMany({ where: { program: programScope }, orderBy: { updatedAt: "desc" }, include: { program: true, uploadedBy: true } }),
    prisma.program.findMany({ where: programScope, orderBy: { name: "asc" } })
  ]);
}
