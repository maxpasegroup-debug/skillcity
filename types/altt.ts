import type { LearningStepType, SubmissionStatus } from "@prisma/client";

export type AlttStepView = {
  id: string;
  title: string;
  type: LearningStepType;
  instructions: string | null;
  sortOrder: number;
  required: boolean;
  points: number;
  completed: boolean;
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
