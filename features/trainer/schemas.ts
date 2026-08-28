import { z } from "zod";

export const attendanceSessionSchema = z.object({
  batchId: z.string().uuid(),
  title: z.string().min(2).max(180),
  sessionDate: z.string().min(1),
  notes: z.string().optional()
});

export const attendanceRecordSchema = z.object({
  sessionId: z.string().uuid(),
  studentId: z.string().uuid(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  note: z.string().optional()
});

export const trainerClassScheduleSchema = z.object({
  batchId: z.string().uuid(),
  title: z.string().min(2).max(180),
  type: z.enum(["LIVE_CLASS", "OFFLINE_WORKSHOP", "MEETING"]),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
  location: z.string().max(240).optional(),
  description: z.string().max(800).optional()
});

export const submissionReviewSchema = z.object({
  submissionId: z.string().uuid(),
  status: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
  score: z.coerce.number().int().min(0).max(100).optional(),
  feedback: z.string().min(2)
});

export const reflectionReviewSchema = z.object({
  reflectionId: z.string().uuid(),
  comment: z.string().min(2),
  flagConcern: z.coerce.boolean().optional(),
  taraFollowUpRecommended: z.coerce.boolean().optional()
});

export const assessmentReviewSchema = z.object({
  assessmentId: z.string().uuid(),
  score: z.coerce.number().int().min(0),
  feedback: z.string().min(2)
});

export const resourceSchema = z.object({
  batchId: z.string().uuid().optional().or(z.literal("")),
  categoryName: z.string().min(2).max(120),
  type: z.enum(["VIDEO", "PDF", "CODE_SAMPLE", "TEMPLATE", "REFERENCE_LINK", "VOICE_NOTE"]),
  title: z.string().min(2).max(180),
  description: z.string().optional(),
  url: z.string().url()
});

export const trainerAnnouncementSchema = z.object({
  batchId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  message: z.string().min(2),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED"]),
  scheduledAt: z.string().optional()
});

export const studentConcernSchema = z.object({
  studentId: z.string().uuid(),
  batchId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  notes: z.string().min(2),
  taraFollowUpRecommended: z.coerce.boolean().optional()
});
