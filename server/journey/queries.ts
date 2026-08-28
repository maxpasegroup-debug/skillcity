import { redirect } from "next/navigation";
import type { Activity, JourneyDay, JourneyPhase, JourneyWeek, StudentProgress, Submission } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import type { JourneyActivityView, JourneyPhaseView } from "@/types/journey";

type DayWithActivities = JourneyDay & {
  activities: Activity[];
};

type WeekWithDays = JourneyWeek & {
  days: DayWithActivities[];
};

type PhaseWithWeeks = JourneyPhase & {
  weeks: WeekWithDays[];
};

export async function requireStudent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getActiveEnrollment(studentId: string) {
  return prisma.studentEnrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE"
    },
    orderBy: {
      startedAt: "desc"
    },
    include: {
      program: true,
      journey: {
        include: {
          phases: {
            orderBy: { order: "asc" },
            include: {
              weeks: {
                orderBy: { weekNumber: "asc" },
                include: {
                  days: {
                    orderBy: { dayNumber: "asc" },
                    include: {
                      activities: {
                        orderBy: { sortOrder: "asc" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      batch: true
    }
  });
}

export async function getStudentProgressMap(studentId: string, activityIds: string[]) {
  if (activityIds.length === 0) {
    return new Map<string, StudentProgress>();
  }

  const progress = await prisma.studentProgress.findMany({
    where: {
      studentId,
      activityId: { in: activityIds }
    }
  });

  return new Map(progress.map((item) => [item.activityId, item]));
}

export async function getStudentSubmissionMap(studentId: string, activityIds: string[]) {
  if (activityIds.length === 0) {
    return new Map<string, Submission>();
  }

  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      activityId: { in: activityIds }
    },
    orderBy: { updatedAt: "desc" }
  });
  const map = new Map<string, Submission>();
  for (const submission of submissions) {
    if (submission.activityId && !map.has(submission.activityId)) {
      map.set(submission.activityId, submission);
    }
  }
  return map;
}

function flattenDays(phases: PhaseWithWeeks[]) {
  return phases.flatMap((phase) => phase.weeks.flatMap((week) => week.days.map((day) => ({ phase, week, day }))));
}

export async function getStudentJourney(studentId: string) {
  const enrollment = await getActiveEnrollment(studentId);

  if (!enrollment) {
    return null;
  }

  const flatDays = flattenDays(enrollment.journey.phases);
  const visibleActivityIds = flatDays.flatMap(({ day }) => day.activities.filter((activity) => !activity.batchId || activity.batchId === enrollment.batchId).map((activity) => activity.id));
  const [progressMap, submissionMap] = await Promise.all([
    getStudentProgressMap(studentId, visibleActivityIds),
    getStudentSubmissionMap(studentId, visibleActivityIds)
  ]);

  let absoluteDay = 0;
  const phases: JourneyPhaseView[] = enrollment.journey.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    order: phase.order,
    description: phase.description,
    weeks: phase.weeks.map((week) => ({
      id: week.id,
      weekNumber: week.weekNumber,
      title: week.title,
      days: week.days.map((day) => {
        absoluteDay += 1;
        const activities: JourneyActivityView[] = day.activities.filter((activity) => !activity.batchId || activity.batchId === enrollment.batchId).map((activity) => {
          const progress = progressMap.get(activity.id);
          const submission = submissionMap.get(activity.id);
          return {
            id: activity.id,
            dayId: activity.dayId,
            title: activity.title,
            type: activity.type,
            description: activity.description,
            duration: activity.duration,
            sortOrder: activity.sortOrder,
            required: activity.required,
            points: activity.points,
            dueAt: activity.dueAt,
            resourceUrl: activity.resourceUrl,
            progressStatus: progress?.status ?? "NOT_STARTED",
            completedAt: progress?.completedAt ?? null,
            score: progress?.score ?? null,
            reflection: progress?.reflection ?? null,
            submissionStatus: submission?.status ?? null,
            submittedAt: submission?.submittedAt ?? null
          };
        });
        const completedActivityCount = activities.filter((activity) => activity.progressStatus === "COMPLETED").length;
        const state =
          absoluteDay < enrollment.currentDay
            ? "completed"
            : absoluteDay === enrollment.currentDay
              ? "current"
              : absoluteDay === enrollment.currentDay + 1
                ? "upcoming"
                : "locked";

        return {
          id: day.id,
          absoluteDay,
          dayNumber: day.dayNumber,
          title: day.title,
          summary: day.summary,
          state,
          activityCount: activities.length,
          completedActivityCount,
          activities
        };
      })
    }))
  }));

  const allDays = phases.flatMap((phase) => phase.weeks.flatMap((week) => week.days));
  const today = allDays.find((day) => day.absoluteDay === enrollment.currentDay) ?? allDays[0] ?? null;
  const allActivities = allDays.flatMap((day) => day.activities);
  const completedActivities = allActivities.filter((activity) => activity.progressStatus === "COMPLETED");
  const requiredActivities = allActivities.filter((activity) => activity.required);
  const completedRequired = requiredActivities.filter((activity) => activity.progressStatus === "COMPLETED");
  const liveActivities = allDays
    .filter((day) => day.absoluteDay >= enrollment.currentDay)
    .flatMap((day) => day.activities.map((activity) => ({ day, activity })))
    .find(({ activity }) => activity.type === "LIVE" && activity.progressStatus !== "COMPLETED");

  const completedDayNumbers = new Set(
    allDays
      .filter((day) => {
        const required = day.activities.filter((activity) => activity.required);
        return required.length > 0 && required.every((activity) => activity.progressStatus === "COMPLETED");
      })
      .map((day) => day.absoluteDay)
  );
  let streak = 0;
  for (let dayNumber = enrollment.currentDay - 1; dayNumber >= 1; dayNumber -= 1) {
    if (!completedDayNumbers.has(dayNumber)) {
      break;
    }
    streak += 1;
  }

  return {
    enrollment,
    phases,
    today,
    stats: {
      progressPercent: requiredActivities.length === 0 ? 0 : Math.round((completedRequired.length / requiredActivities.length) * 100),
      attendanceLabel: liveActivities ? "Next session ready" : "No live sessions",
      xp: completedActivities.reduce((total, activity) => total + activity.points, 0),
      streak,
      pendingTasks: today?.activities.filter((activity) => activity.required && activity.progressStatus !== "COMPLETED").length ?? 0,
      upcomingLiveClass: liveActivities ? `${liveActivities.activity.title} - Day ${liveActivities.day.absoluteDay}` : null
    }
  };
}

export async function getStudentOnboardingHome(studentId: string) {
  const journey = await getStudentJourney(studentId);

  if (!journey) {
    return {
      journey: null,
      onboardingState: "NO_ENROLLMENT" as const,
      nextClass: null,
      attendance: null,
      pendingSubmissions: 0,
      todaysTasks: 0,
      pendingTasks: []
    };
  }

  const now = new Date();
  const [nextClass, attendanceRecords, pendingSubmissions, completedProgress] = await Promise.all([
    journey.enrollment.batchId
      ? prisma.calendarEvent.findFirst({
          where: {
            batchId: journey.enrollment.batchId,
            startsAt: { gte: now },
            status: { in: ["SCHEDULED", "RESCHEDULED"] },
            type: { in: ["LIVE_CLASS", "OFFLINE_WORKSHOP", "MEETING"] }
          },
          orderBy: { startsAt: "asc" },
          include: { batch: { include: { trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } } } }, program: true }
        })
      : null,
    journey.enrollment.batchId
      ? prisma.attendanceRecord.findMany({
          where: { studentId, batchId: journey.enrollment.batchId },
          select: { status: true }
        })
      : [],
    prisma.submission.count({
      where: { studentId, status: { in: ["DRAFT", "RETURNED"] } }
    }),
    prisma.studentProgress.count({
      where: { studentId, status: "COMPLETED" }
    })
  ]);

  const present = attendanceRecords.filter((item) => item.status === "PRESENT" || item.status === "LATE").length;
  const attendance = attendanceRecords.length === 0
    ? null
    : {
        total: attendanceRecords.length,
        attended: present,
        percent: Math.round((present / attendanceRecords.length) * 100)
      };

  const onboardingState = !journey.enrollment.batchId
    ? "BATCH_PENDING"
    : attendanceRecords.length === 0 && completedProgress === 0
      ? "ORIENTATION_PENDING"
      : "ACTIVE";

  return {
    journey,
    onboardingState,
    nextClass,
    attendance,
    pendingSubmissions,
    todaysTasks: journey.today?.activities.filter((activity) => activity.required && activity.progressStatus !== "COMPLETED").length ?? 0,
    pendingTasks: journey.phases
      .flatMap((phase) => phase.weeks.flatMap((week) => week.days.flatMap((day) => day.activities.map((activity) => ({ day, activity })))))
      .filter(({ activity }) => ["TASK", "PROJECT", "ASSESSMENT"].includes(activity.type) && activity.progressStatus !== "COMPLETED")
      .slice(0, 6)
      .map(({ day, activity }) => ({
        id: activity.id,
        dayId: day.id,
        title: activity.title,
        dueAt: activity.dueAt,
        status: activity.submissionStatus === "SUBMITTED" ? "SUBMITTED" : activity.dueAt && activity.dueAt < now ? "OVERDUE" : "PENDING"
      }))
  };
}

export async function getStudentDay(studentId: string, dayId: string) {
  const journey = await getStudentJourney(studentId);

  if (!journey) {
    return null;
  }

  const day = journey.phases.flatMap((phase) => phase.weeks.flatMap((week) => week.days)).find((item) => item.id === dayId);

  if (!day) {
    return null;
  }

  return {
    ...journey,
    selectedDay: day
  };
}

export async function getStudentAnnouncements(studentId: string) {
  const enrollment = await getActiveEnrollment(studentId);
  const now = new Date();

  return prisma.announcement.findMany({
    where: {
      publishedAt: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ],
      AND: enrollment
        ? [
            {
              OR: [
                { audience: "ALL" },
                { audience: "PROGRAM", programId: enrollment.programId },
                { audience: "BATCH", batchId: enrollment.batchId }
              ]
            }
          ]
        : [{ audience: "ALL" }]
    },
    orderBy: { publishedAt: "desc" },
    take: 5
  });
}

export async function getStudentCalendar(studentId: string) {
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId, status: "ACTIVE", batchId: { not: null } },
    orderBy: { startedAt: "desc" },
    include: { batch: true, program: true }
  });

  if (!enrollment?.batchId) {
    return { enrollment, events: [] };
  }

  const now = new Date();
  const monthAhead = new Date(now);
  monthAhead.setDate(monthAhead.getDate() + 30);

  const events = await prisma.calendarEvent.findMany({
    where: {
      batchId: enrollment.batchId,
      startsAt: { gte: now, lte: monthAhead },
      status: { in: ["SCHEDULED", "RESCHEDULED"] }
    },
    orderBy: { startsAt: "asc" },
    include: { batch: { include: { trainerAssignments: { where: { status: "ACTIVE" }, include: { trainer: true } } } }, program: true }
  });

  return { enrollment, events };
}
