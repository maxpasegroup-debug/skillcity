import { z } from "zod";

export const programFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180).regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  durationDays: z.coerce.number().int().positive().max(3650),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  thumbnail: z.string().url().optional().or(z.literal("")),
  journeyVersion: z.coerce.number().int().positive(),
  enrollmentOpen: z.enum(["on", "off"]).default("off"),
  archive: z.enum(["on", "off"]).default("off")
});

export const blueprintFormSchema = z.object({
  programId: z.string().uuid(),
  journeyId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2).max(180),
  description: z.string().optional(),
  versionTitle: z.string().min(2).max(180)
});

export const batchFormSchema = z.object({
  programId: z.string().uuid(),
  journeyId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2).max(160),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  enrollmentLimit: z.coerce.number().int().positive().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"])
});

export const trainerAssignmentSchema = z.object({
  trainerId: z.string().uuid(),
  batchId: z.string().uuid(),
  role: z.string().min(2).max(100),
  startsAt: z.string().optional(),
  endsAt: z.string().optional()
});

export const directorAnnouncementSchema = z.object({
  type: z.enum(["GENERAL", "EMERGENCY", "MOTIVATION", "ASSIGNMENT", "HOLIDAY", "PLACEMENT", "FEE_REMINDER", "OFFLINE_EVENT"]),
  recipientType: z.enum(["PLATFORM", "PROGRAM", "BATCH", "STUDENTS"]),
  programId: z.string().uuid().optional().or(z.literal("")),
  batchId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  message: z.string().min(5),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]),
  scheduledAt: z.string().optional()
});

export const contentLibrarySchema = z.object({
  programId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  type: z.enum(["VIDEO", "PDF", "ARTICLE", "VOICE_NOTE", "EXTERNAL_LINK"]),
  url: z.string().url(),
  description: z.string().optional(),
  duration: z.coerce.number().int().positive().optional().or(z.literal(""))
});

export const calendarEventSchema = z.object({
  programId: z.string().uuid().optional().or(z.literal("")),
  journeyId: z.string().uuid().optional().or(z.literal("")),
  batchId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  description: z.string().optional(),
  type: z.enum(["LIVE_CLASS", "OFFLINE_WORKSHOP", "HOLIDAY", "RESCHEDULED_EVENT", "ASSESSMENT", "MEETING"]),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
  location: z.string().optional()
});

export const activityPlannerSchema = z.object({
  dayId: z.string().uuid(),
  title: z.string().min(2).max(180),
  type: z.enum(["VIDEO", "LIVE", "ARTICLE", "PDF", "TASK", "QUIZ", "PROJECT", "AI_CHAT", "REFLECTION", "MEETING", "OFFLINE", "VOICE_NOTE", "ASSESSMENT", "LINK"]),
  description: z.string().optional(),
  duration: z.coerce.number().int().positive().optional().or(z.literal("")),
  required: z.enum(["on", "off"]).default("on"),
  points: z.coerce.number().int().min(0).max(10000)
});
