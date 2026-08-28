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

  const [classesToday, students, pendingReviews, pendingTasks, reflections, assessments, liveSessions, attendance, announcements, concerns, pendingReviewItems, attentionEnrollments] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { batchId: { in: batchIds }, startsAt: { gte: start, lte: end }, status: { in: ["SCHEDULED", "RESCHEDULED", "COMPLETED"] } },
      orderBy: { startsAt: "asc" },
      include: {
        batch: { include: { enrollments: { where: { status: "ACTIVE" }, select: { id: true } } } },
        attendanceSessions: { include: { records: true } }
      }
    }),
    prisma.studentEnrollment.count({ where: { batchId: { in: batchIds }, status: "ACTIVE" } }),
    prisma.submission.count({ where: { status: "SUBMITTED", student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } } }),
    prisma.activity.count({ where: { batchId: { in: batchIds }, type: { in: ["TASK", "PROJECT", "ASSESSMENT"] }, progress: { none: { status: "COMPLETED" } } } }),
    prisma.studentReflection.count({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } }, trainerFeedback: { none: {} } } }),
    prisma.assessmentResult.count({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } }, trainerFeedback: { none: {} } } }),
    prisma.calendarEvent.count({ where: { batchId: { in: batchIds }, type: "LIVE_CLASS", startsAt: { gte: now }, status: { in: ["SCHEDULED", "RESCHEDULED"] } } }),
    prisma.attendanceRecord.findMany({ where: { batchId: { in: batchIds }, session: { sessionDate: { gte: start, lte: end } } } }),
    prisma.trainerAnnouncement.findMany({ where: { OR: [{ trainerId }, { batchId: { in: batchIds } }] }, orderBy: { updatedAt: "desc" }, take: 6, include: { batch: true } }),
    prisma.studentConcern.findMany({ where: { batchId: { in: batchIds }, status: { in: ["OPEN", "FOLLOW_UP"] } }, orderBy: { updatedAt: "desc" }, take: 6, include: { student: true, batch: true } }),
    prisma.submission.findMany({
      where: { status: "SUBMITTED", student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } },
      orderBy: { submittedAt: "asc" },
      take: 6,
      include: { student: true, activity: true, day: true }
    }),
    prisma.studentEnrollment.findMany({
      where: { batchId: { in: batchIds }, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 40,
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
    })
  ]);

  const present = attendance.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;
  const staleDate = new Date(now);
  staleDate.setDate(staleDate.getDate() - 14);
  const studentsNeedingAttention = attentionEnrollments.flatMap((enrollment) => {
    const attended = enrollment.student.attendanceRecords.filter((record) => record.status === "PRESENT" || record.status === "LATE").length;
    const attendancePercent = enrollment.student.attendanceRecords.length === 0 ? null : Math.round((attended / enrollment.student.attendanceRecords.length) * 100);
    const overdueTasks = enrollment.batch?.activities.filter((activity) => activity.dueAt && activity.dueAt < now && !activity.progress.some((progress) => progress.studentId === enrollment.studentId && progress.status === "COMPLETED")).length ?? 0;
    const pendingSubmissions = enrollment.student.submissions.filter((submission) => submission.status === "SUBMITTED").length;
    const lastProgressAt = enrollment.student.progress[0]?.updatedAt;
    const lastSubmissionAt = enrollment.student.submissions[0]?.updatedAt;
    const lastActivityAt = [lastProgressAt, lastSubmissionAt].filter(Boolean).sort((a, b) => Number(b) - Number(a))[0];
    const reasons = [
      attendancePercent !== null && attendancePercent < 75 ? `Attendance ${attendancePercent}%` : null,
      overdueTasks > 1 ? `${overdueTasks} overdue tasks` : null,
      pendingSubmissions > 0 ? `${pendingSubmissions} pending reviews` : null,
      !lastActivityAt || lastActivityAt < staleDate ? "No recent activity" : null
    ].filter(Boolean) as string[];
    return reasons.length > 0 ? [{ studentId: enrollment.studentId, studentName: enrollment.student.name, batchId: enrollment.batchId, batchName: enrollment.batch?.name ?? "Batch", reasons }] : [];
  }).slice(0, 6);

  return {
    batchIds,
    classesToday,
    announcements,
    concerns,
    pendingReviewItems,
    studentsNeedingAttention,
    stats: {
      todaysClasses: classesToday.length,
      todaysStudents: students,
      pendingReviews,
      pendingTasks,
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
  const [batches, submissions, reflections, assessments, attendanceSessions, resources, announcements, concerns, calendarEvents, tasks] = await Promise.all([
    prisma.batch.findMany({
      where: { id: { in: batchIds } },
      orderBy: { name: "asc" },
      include: {
        program: true,
        journey: {
          include: {
            phases: {
              orderBy: { order: "asc" },
              include: { weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayNumber: "asc" } } } } }
            }
          }
        },
        enrollments: { include: { student: { include: { progress: true, submissions: true, attendanceRecords: true } } } },
        activities: { where: { type: { in: ["TASK", "PROJECT", "ASSESSMENT"] } }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], include: { submissions: { include: { student: true } }, progress: true, day: true } }
      }
    }),
    prisma.submission.findMany({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } }, orderBy: { updatedAt: "desc" }, take: 80, include: { student: true, day: true, activity: true, reviews: true } }),
    prisma.studentReflection.findMany({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } }, orderBy: { updatedAt: "desc" }, take: 80, include: { student: true, reflection: true, trainerFeedback: true } }),
    prisma.assessmentResult.findMany({ where: { student: { enrollments: { some: { batchId: { in: batchIds }, status: "ACTIVE" } } } }, orderBy: { updatedAt: "desc" }, take: 80, include: { student: true, day: true, trainerFeedback: true } }),
    prisma.attendanceSession.findMany({ where: { batchId: { in: batchIds } }, orderBy: { sessionDate: "desc" }, take: 40, include: { batch: true, records: { include: { student: true } } } }),
    prisma.resource.findMany({ where: { OR: [{ trainerId }, { batchId: { in: batchIds } }] }, orderBy: { updatedAt: "desc" }, include: { batch: true, category: true } }),
    prisma.trainerAnnouncement.findMany({ where: { OR: [{ trainerId }, { batchId: { in: batchIds } }] }, orderBy: { updatedAt: "desc" }, include: { batch: true } }),
    prisma.studentConcern.findMany({ where: { batchId: { in: batchIds } }, orderBy: { updatedAt: "desc" }, include: { student: true, batch: true } }),
    prisma.calendarEvent.findMany({ where: { batchId: { in: batchIds } }, orderBy: { startsAt: "asc" }, take: 60, include: { batch: true, program: true } }),
    prisma.activity.findMany({ where: { batchId: { in: batchIds }, type: { in: ["TASK", "PROJECT", "ASSESSMENT"] } }, orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }], include: { batch: true, day: true, submissions: true, progress: true } })
  ]);
  return { batchIds, batches, submissions, reflections, assessments, attendanceSessions, resources, announcements, concerns, calendarEvents, tasks };
}

export async function getTrainerBatchDetail(trainerId: string, batchId: string) {
  await assertTrainerBatchAccess(trainerId, batchId);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      program: true,
      journey: true,
      trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        orderBy: { student: { name: "asc" } },
        include: {
          student: {
            include: {
              progress: { include: { activity: true } },
              submissions: { include: { activity: true } },
              attendanceRecords: { include: { session: true } }
            }
          }
        }
      },
      calendarEvents: {
        where: { startsAt: { gte: start }, status: { in: ["SCHEDULED", "RESCHEDULED", "COMPLETED"] } },
        orderBy: { startsAt: "asc" },
        take: 8
      },
      attendanceSessions: {
        where: { sessionDate: { gte: start, lt: end } },
        include: { records: { include: { student: true } } },
        orderBy: { sessionDate: "asc" }
      },
      activities: {
        where: { type: { in: ["TASK", "PROJECT", "ASSESSMENT"] } },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        include: { submissions: { include: { student: true } }, progress: true, day: true }
      }
    }
  });
}

export async function getTrainerStudentAcademicDetail(trainerId: string, studentId: string) {
  const batchIds = await getAssignedBatchIds(trainerId);
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId, status: "ACTIVE", batchId: { in: batchIds } },
    orderBy: { startedAt: "desc" },
    include: {
      program: true,
      journey: true,
      batch: { include: { trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } }, activities: { where: { type: { in: ["TASK", "PROJECT", "ASSESSMENT"] } }, include: { progress: true, submissions: true, day: true } } } },
      student: {
        include: {
          progress: { include: { activity: true }, orderBy: { updatedAt: "desc" }, take: 40 },
          submissions: { include: { activity: true, day: true, reviews: true }, orderBy: { updatedAt: "desc" }, take: 40 },
          attendanceRecords: { include: { session: true }, orderBy: { updatedAt: "desc" }, take: 60 },
          activationProfile: true
        }
      }
    }
  });

  return enrollment;
}
