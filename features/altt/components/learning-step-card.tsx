import type { LearningStepType } from "@prisma/client";
import { Bot, CheckSquare, Code2, FileUp, FileText, LinkIcon, Mic, NotebookText, PenLine, Presentation, ScrollText, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AlttStepView } from "@/types/altt";
import { StepCompleteButton } from "./step-complete-button";
import { AssessmentResultForm, QuizAttemptForm, SubmissionForm } from "./altt-forms";

const icons: Record<LearningStepType, React.ComponentType<{ className?: string }>> = {
  VIDEO: Video,
  ARTICLE: ScrollText,
  PDF: FileText,
  INTERACTIVE_READING: NotebookText,
  QUIZ: CheckSquare,
  CODING_PRACTICE: Code2,
  PROJECT_TASK: Presentation,
  REFLECTION: PenLine,
  AI_DISCUSSION: Bot,
  VOICE_INSTRUCTION: Mic,
  CHECKLIST: CheckSquare,
  EXTERNAL_LINK: LinkIcon,
  FILE_UPLOAD: FileUp,
  ASSESSMENT: CheckSquare,
  OFFLINE_ACTIVITY: NotebookText
};

export function LearningStepCard({ step, dayId }: { step: AlttStepView; dayId: string }) {
  const Icon = icons[step.type];
  const needsSubmission = ["PROJECT_TASK", "FILE_UPLOAD", "CODING_PRACTICE"].includes(step.type);
  return (
    <Card className={step.completed ? "bg-white ring-1 ring-black/5" : undefined}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red"><Icon className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-black text-brand-red">Step {step.sortOrder} · {step.type.replaceAll("_", " ")}</p>
              <h3 className="mt-2 text-2xl font-black text-brand-dark">{step.title}</h3>
              {step.instructions ? <p className="mt-3 max-w-2xl text-base leading-7 text-brand-muted">{step.instructions}</p> : null}
              <p className="mt-3 text-sm font-bold text-brand-muted">{step.points} XP · {step.required ? "Required" : "Optional"}</p>
            </div>
          </div>
          <StepCompleteButton stepId={step.id} dayId={dayId} completed={step.completed} />
        </div>
        {needsSubmission ? <div className="mt-6 rounded-lg bg-brand-card p-5"><SubmissionForm dayId={dayId} stepId={step.id} /></div> : null}
        {step.type === "QUIZ" ? <div className="mt-6 rounded-lg bg-brand-card p-5"><QuizAttemptForm dayId={dayId} stepId={step.id} /></div> : null}
        {step.type === "ASSESSMENT" ? <div className="mt-6 rounded-lg bg-brand-card p-5"><AssessmentResultForm dayId={dayId} stepId={step.id} /></div> : null}
      </CardContent>
    </Card>
  );
}

export function VideoStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function ArticleStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function PdfStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function InteractiveReadingStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function QuizStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function CodingPracticeStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function ProjectTaskStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function ReflectionStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function AiDiscussionStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function VoiceInstructionStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function ChecklistStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function ExternalLinkStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function FileUploadStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function AssessmentStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
export function OfflineActivityStep(props: { step: AlttStepView; dayId: string }) { return <LearningStepCard {...props} />; }
