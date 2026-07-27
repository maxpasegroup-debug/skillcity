import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

const directorRoles = new Set(["Director", "Admin"]);

export async function requireDirector() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => directorRoles.has(role))) {
    redirect("/dashboard");
  }

  return user;
}

export async function getDirectorDashboard() {
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
    prisma.program.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.batch.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { roles: { some: { role: { name: "Student" } } }, deletedAt: null } }),
    prisma.activity.count({
      where: {
        day: {
          week: {
            phase: {
              journey: {
                enrollments: { some: { status: "ACTIVE" } }
              }
            }
          }
        }
      }
    }),
    prisma.calendarEvent.count({ where: { type: "LIVE_CLASS", startsAt: { gte: now }, status: { in: ["SCHEDULED", "RESCHEDULED"] } } }),
    prisma.studentProgress.count({ where: { status: "IN_PROGRESS", activity: { type: { in: ["PROJECT", "ASSESSMENT", "TASK"] } } } }),
    prisma.directorAnnouncement.count({ where: { status: "PUBLISHED" } }),
    prisma.studentEnrollment.findMany({ where: { status: "ACTIVE" }, select: { currentDay: true, program: { select: { durationDays: true } } } }),
    prisma.studentProgress.count({ where: { status: "COMPLETED" } }),
    prisma.activity.count({ where: { required: true } }),
    prisma.calendarEvent.findMany({
      where: { type: "LIVE_CLASS", startsAt: { gte: now }, status: { in: ["SCHEDULED", "RESCHEDULED"] } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { batch: true, program: true }
    }),
    prisma.studentEnrollment.findMany({ where: { status: "ACTIVE" }, select: { studentId: true } }),
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

export function getDirectorPrograms() {
  return prisma.program.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      journeys: { orderBy: { version: "desc" }, take: 1 },
      batches: true,
      enrollments: true
    }
  });
}

export function getDirectorBlueprints() {
  return prisma.blueprint.findMany({
    orderBy: { updatedAt: "desc" },
    include: { program: true, journey: true, versions: { orderBy: { version: "desc" }, take: 1 } }
  });
}

export function getDirectorBatches() {
  return prisma.batch.findMany({
    orderBy: { createdAt: "desc" },
    include: { program: true, journey: true, enrollments: true, trainerAssignments: { include: { trainer: true } } }
  });
}

export async function getDirectorPlanner() {
  const journeys = await prisma.journey.findMany({
    where: { status: { in: ["ACTIVE", "DRAFT"] } },
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

export function getDirectorTrainersAndBatches() {
  return Promise.all([
    prisma.user.findMany({
      where: { roles: { some: { role: { name: "Trainer" } } }, deletedAt: null },
      orderBy: { name: "asc" }
    }),
    getDirectorBatches(),
    prisma.trainerAssignment.findMany({ include: { trainer: true, batch: { include: { program: true } } }, orderBy: { createdAt: "desc" } })
  ]);
}

export function getDirectorCommunicationData() {
  return Promise.all([
    prisma.directorAnnouncement.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { program: true, batch: true } }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.batch.findMany({ orderBy: { name: "asc" } })
  ]);
}

export function getDirectorCalendarData() {
  const now = new Date();
  const monthAhead = new Date(now);
  monthAhead.setDate(monthAhead.getDate() + 30);

  return Promise.all([
    prisma.calendarEvent.findMany({
      where: { startsAt: { gte: now, lte: monthAhead } },
      orderBy: { startsAt: "asc" },
      include: { program: true, batch: true }
    }),
    prisma.program.findMany({ orderBy: { name: "asc" } }),
    prisma.batch.findMany({ orderBy: { name: "asc" } }),
    prisma.journey.findMany({ orderBy: { updatedAt: "desc" }, include: { program: true } })
  ]);
}

export function getDirectorContentLibrary() {
  return Promise.all([
    prisma.contentLibrary.findMany({ orderBy: { updatedAt: "desc" }, include: { program: true, uploadedBy: true } }),
    prisma.program.findMany({ orderBy: { name: "asc" } })
  ]);
}
