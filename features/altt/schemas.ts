import { z } from "zod";

export const reflectionAnswerSchema = z.object({
  dayId: z.string().uuid(),
  answers: z.array(z.object({ reflectionId: z.string().uuid(), answer: z.string().min(2) }))
});

export const submissionSchema = z.object({
  dayId: z.string().uuid(),
  stepId: z.string().uuid().optional().or(z.literal("")),
  activityId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  type: z.enum(["TEXT", "URL", "GITHUB_REPOSITORY", "FILE", "IMAGE", "DOCUMENT", "VIDEO_LINK"]),
  content: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "SUBMITTED"])
});

export const quizAttemptSchema = z.object({
  dayId: z.string().uuid(),
  stepId: z.string().uuid().optional().or(z.literal("")),
  activityId: z.string().uuid().optional().or(z.literal("")),
  answers: z.string().min(2)
});

export const assessmentResultSchema = z.object({
  dayId: z.string().uuid(),
  stepId: z.string().uuid().optional().or(z.literal("")),
  activityId: z.string().uuid().optional().or(z.literal("")),
  type: z.enum(["DAILY", "WEEKLY", "FINAL"]),
  score: z.coerce.number().int().min(0),
  maxScore: z.coerce.number().int().positive(),
  feedback: z.string().optional()
});

export const learningFlowSchema = z.object({
  name: z.string().min(2).max(180),
  description: z.string().optional(),
  version: z.coerce.number().int().positive()
});

export const attachLearningFlowSchema = z.object({
  dayId: z.string().uuid(),
  learningFlowId: z.string().uuid()
});
