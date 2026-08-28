import type { ActivityType } from "@prisma/client";
import type React from "react";
import {
  Bot,
  ClipboardCheck,
  FileText,
  LinkIcon,
  Mic,
  MonitorPlay,
  NotebookText,
  PenLine,
  Presentation,
  Radio,
  ScrollText,
  Users,
  Video
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionForm } from "@/features/altt/components/altt-forms";
import type { JourneyActivityView } from "@/types/journey";
import { ActivityCompleteButton } from "./activity-complete-button";

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  VIDEO: Video,
  LIVE: Radio,
  ARTICLE: ScrollText,
  PDF: FileText,
  TASK: ClipboardCheck,
  QUIZ: NotebookText,
  PROJECT: Presentation,
  AI_CHAT: Bot,
  REFLECTION: PenLine,
  MEETING: Users,
  OFFLINE: MonitorPlay,
  VOICE_NOTE: Mic,
  ASSESSMENT: ClipboardCheck,
  LINK: LinkIcon
};

const activityLabels: Record<ActivityType, string> = {
  VIDEO: "Watch Video",
  LIVE: "Live Session",
  ARTICLE: "Read Article",
  PDF: "Read PDF",
  TASK: "Practice Task",
  QUIZ: "Quiz",
  PROJECT: "Project",
  AI_CHAT: "AI Chat",
  REFLECTION: "Reflection",
  MEETING: "Meeting",
  OFFLINE: "Offline Work",
  VOICE_NOTE: "Voice Note",
  ASSESSMENT: "Assessment",
  LINK: "Open Link"
};

export function ActivityCard({ activity }: { activity: JourneyActivityView }) {
  const Icon = activityIcons[activity.type];
  const completed = activity.progressStatus === "COMPLETED";
  const needsSubmission = ["TASK", "PROJECT", "ASSESSMENT"].includes(activity.type);
  const overdue = Boolean(activity.dueAt && activity.dueAt < new Date() && !completed && activity.submissionStatus !== "SUBMITTED");
  const status = completed
    ? "COMPLETED"
    : activity.submissionStatus === "APPROVED"
      ? "REVIEWED"
      : activity.submissionStatus === "SUBMITTED"
        ? "SUBMITTED"
        : overdue
          ? "OVERDUE"
          : "PENDING";

  return (
    <Card className={completed ? "bg-white ring-1 ring-black/5" : undefined}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black text-brand-red">{activityLabels[activity.type]}</p>
              <h3 className="mt-2 text-2xl font-black text-brand-dark">{activity.title}</h3>
              {activity.description ? <p className="mt-3 max-w-2xl text-base leading-7 text-brand-muted">{activity.description}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-brand-muted">
                {activity.duration ? <span>{activity.duration} min</span> : null}
                <span>{activity.points} XP</span>
                <span>{activity.required ? "Required" : "Optional"}</span>
                {activity.dueAt ? <span>Due {activity.dueAt.toLocaleString()}</span> : null}
                {needsSubmission ? <span>{status}</span> : null}
              </div>
              {activity.resourceUrl ? <a href={activity.resourceUrl} className="mt-3 block break-all font-bold text-brand-red" target="_blank" rel="noreferrer">Open resource</a> : null}
            </div>
          </div>
          {needsSubmission ? null : <ActivityCompleteButton activityId={activity.id} completed={completed} />}
        </div>
        {needsSubmission && !completed && activity.submissionStatus !== "SUBMITTED" ? (
          <div className="mt-6 rounded-lg bg-brand-card p-5">
            <SubmissionForm dayId={activity.dayId} activityId={activity.id} defaultTitle={activity.title} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function VideoCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function ArticleCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function PdfCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function QuizCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function ProjectCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function LiveSessionCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function ReflectionCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function TaskCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function MeetingCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}

export function AiChatCard(props: { activity: JourneyActivityView }) {
  return <ActivityCard {...props} />;
}
