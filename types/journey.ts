import type { ActivityType, ProgressStatus, SubmissionStatus } from "@prisma/client";

export type TimelineDayState = "completed" | "current" | "locked" | "upcoming";

export type JourneyActivityView = {
  id: string;
  dayId: string;
  title: string;
  type: ActivityType;
  description: string | null;
  duration: number | null;
  sortOrder: number;
  required: boolean;
  points: number;
  dueAt: Date | null;
  resourceUrl: string | null;
  progressStatus: ProgressStatus;
  completedAt: Date | null;
  score: number | null;
  reflection: string | null;
  submissionStatus: SubmissionStatus | null;
  submittedAt: Date | null;
};

export type JourneyDayView = {
  id: string;
  absoluteDay: number;
  dayNumber: number;
  title: string;
  summary: string | null;
  state: TimelineDayState;
  activityCount: number;
  completedActivityCount: number;
  activities: JourneyActivityView[];
};

export type JourneyWeekView = {
  id: string;
  weekNumber: number;
  title: string;
  days: JourneyDayView[];
};

export type JourneyPhaseView = {
  id: string;
  title: string;
  order: number;
  description: string | null;
  weeks: JourneyWeekView[];
};
