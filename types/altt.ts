import type { LearningStepType, SubmissionStatus } from "@prisma/client";
import type { AlttStage } from "@/lib/academic/altt";

export type AlttStepView = {
  id: string;
  title: string;
  type: LearningStepType;
  instructions: string | null;
  sortOrder: number;
  required: boolean;
  points: number;
  completed: boolean;
  alttStage: AlttStage;
};

export type AlttProgressView = {
  currentStep: AlttStepView | null;
  completedSteps: number;
  totalSteps: number;
  completionPercent: number;
  reflectionStatus: "Pending" | "Complete";
  submissionStatus: SubmissionStatus | "Not Required";
  assessmentStatus: "Pending" | "Complete" | "Not Required";
};
