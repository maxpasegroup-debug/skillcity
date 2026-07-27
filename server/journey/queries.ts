import { redirect } from "next/navigation";
import type { Activity, JourneyDay, JourneyPhase, JourneyWeek, StudentProgress } from "@prisma/client";
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

function flattenDays(phases: PhaseWithWeeks[]) {
  return phases.flatMap((phase) => phase.weeks.flatMap((week) => week.days.map((day) => ({ phase, week, day }))));
}

export async function getStudentJourney(studentId: string) {
  const enrollment = await getActiveEnrollment(studentId);

  if (!enrollment) {
    return null;
  }

  const flatDays = flattenDays(enrollment.journey.phases);
  const activityIds = flatDays.flatMap(({ day }) => day.activities.map((activity) => activity.id));
  const progressMap = await getStudentProgressMap(studentId, activityIds);

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
        const activities: JourneyActivityView[] = day.activities.map((activity) => {
          const progress = progressMap.get(activity.id);
          return {
            id: activity.id,
            title: activity.title,
            type: activity.type,
            description: activity.description,
            duration: activity.duration,
            sortOrder: activity.sortOrder,
            required: activity.required,
            points: activity.points,
            progressStatus: progress?.status ?? "NOT_STARTED",
            completedAt: progress?.completedAt ?? null,
            score: progress?.score ?? null,
            reflection: progress?.reflection ?? null
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
