import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

const trainerRoles = new Set(["Trainer", "Director", "Admin"]);

export async function requireTrainer() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => trainerRoles.has(role))) redirect("/dashboard");
  return user;
}

export async function getAssignedBatchIds(trainerId: string) {
  const assignments = await prisma.trainerAssignment.findMany({
    where: { trainerId, status: "ACTIVE" },
    select: { batchId: true }
  });
  return assignments.map((item) => item.batchId);
}

export async function assertTrainerBatchAccess(trainerId: string, batchId: string) {
  const assignment = await prisma.trainerAssignment.findFirst({ where: { trainerId, batchId, status: "ACTIVE" } });
  if (!assignment) throw new Error("Trainer is not assigned to this batch.");
}

export async function getTrainerDashboard(trainerId: string) {
  const batchIds = await getAssignedBatchIds(trainerId);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const [classesToday, students, pendingReviews, reflections, assessments, liveSessions, attendance, announcements, concerns] = await Promise.all([
    prisma.calendarEvent.findMany({ where: { batchId: { in: batchIds }, startsAt: { gte: start, lte: end }, status: { in: ["SCHEDULED", "RESCHEDULED"] } }, orderBy: { startsAt: "asc" }, include: { batch: true } }),
    prisma.studentEnrollment.count({ where: { batchId: { in: batchIds }, status: "ACTIVE" } }),
    prisma.submission.count({ where: { status: "SUBMITTED", student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } } }),
    prisma.studentReflection.count({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } }, trainerFeedback: { none: {} } } }),
    prisma.assessmentResult.count({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } }, trainerFeedback: { none: {} } } }),
    prisma.calendarEvent.count({ where: { batchId: { in: batchIds }, type: "LIVE_CLASS", startsAt: { gte: now }, status: { in: ["SCHEDULED", "RESCHEDULED"] } } }),
    prisma.attendanceRecord.findMany({ where: { batchId: { in: batchIds }, session: { sessionDate: { gte: start, lte: end } } } }),
    prisma.trainerAnnouncement.findMany({ where: { OR: [{ trainerId }, { batchId: { in: batchIds } }] }, orderBy: { updatedAt: "desc" }, take: 6, include: { batch: true } }),
    prisma.studentConcern.findMany({ where: { batchId: { in: batchIds }, status: { in: ["OPEN", "FOLLOW_UP"] } }, orderBy: { updatedAt: "desc" }, take: 6, include: { student: true, batch: true } })
  ]);

  const present = attendance.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;
  return {
    batchIds,
    classesToday,
    announcements,
    concerns,
    stats: {
      todaysClasses: classesToday.length,
      todaysStudents: students,
      pendingReviews,
      pendingReflections: reflections,
      pendingAssessments: assessments,
      upcomingLiveSessions: liveSessions,
      attendanceToday: attendance.length === 0 ? 0 : Math.round((present / attendance.length) * 100),
      studentEngagement: students === 0 ? 0 : Math.max(0, 100 - Math.min(pendingReviews + reflections, 100))
    }
  };
}

export async function getTrainerWorkspaceData(trainerId: string) {
  const batchIds = await getAssignedBatchIds(trainerId);
  const [batches, submissions, reflections, assessments, attendanceSessions, resources, announcements, concerns, calendarEvents] = await Promise.all([
    prisma.batch.findMany({ where: { id: { in: batchIds } }, orderBy: { name: "asc" }, include: { program: true, journey: true, enrollments: { include: { student: true, progress: true } } } }),
    prisma.submission.findMany({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } }, orderBy: { updatedAt: "desc" }, take: 80, include: { student: true, day: true, reviews: true } }),
    prisma.studentReflection.findMany({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } }, orderBy: { updatedAt: "desc" }, take: 80, include: { student: true, reflection: true, trainerFeedback: true } }),
    prisma.assessmentResult.findMany({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } }, orderBy: { updatedAt: "desc" }, take: 80, include: { student: true, day: true, trainerFeedback: true } }),
    prisma.attendanceSession.findMany({ where: { batchId: { in: batchIds } }, orderBy: { sessionDate: "desc" }, take: 40, include: { batch: true, records: { include: { student: true } } } }),
    prisma.resource.findMany({ where: { OR: [{ trainerId }, { batchId: { in: batchIds } }] }, orderBy: { updatedAt: "desc" }, include: { batch: true, category: true } }),
    prisma.trainerAnnouncement.findMany({ where: { OR: [{ trainerId }, { batchId: { in: batchIds } }] }, orderBy: { updatedAt: "desc" }, include: { batch: true } }),
    prisma.studentConcern.findMany({ where: { batchId: { in: batchIds } }, orderBy: { updatedAt: "desc" }, include: { student: true, batch: true } }),
    prisma.calendarEvent.findMany({ where: { batchId: { in: batchIds } }, orderBy: { startsAt: "asc" }, take: 60, include: { batch: true, program: true } })
  ]);
  return { batchIds, batches, submissions, reflections, assessments, attendanceSessions, resources, announcements, concerns, calendarEvents };
}
