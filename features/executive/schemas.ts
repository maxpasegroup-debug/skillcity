import { z } from "zod";

export const institutionSchema = z.object({
  name: z.string().min(2).max(180),
  slug: z.string().min(2).max(180),
  legalName: z.string().optional()
});

export const campusSchema = z.object({
  institutionId: z.string().uuid(),
  name: z.string().min(2).max(180),
  slug: z.string().min(2).max(180),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional()
});

export const departmentSchema = z.object({
  institutionId: z.string().uuid().optional().or(z.literal("")),
  campusId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().min(2).max(160),
  code: z.string().min(2).max(80),
  description: z.string().optional()
});

export const employeeSchema = z.object({
  userId: z.string().uuid(),
  institutionId: z.string().uuid().optional().or(z.literal("")),
  campusId: z.string().uuid().optional().or(z.literal("")),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  employeeCode: z.string().optional(),
  title: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"])
});

export const automationRuleSchema = z.object({
  name: z.string().min(2).max(180),
  description: z.string().optional(),
  triggerType: z.enum(["STUDENT_ABSENCE", "TRAINER_PENDING_REVIEWS", "FEE_OVERDUE", "CERTIFICATE_ISSUED", "CHALLENGE_COMPLETED", "MANUAL"]),
  actionType: z.enum(["SEND_EMAIL", "SEND_NOTIFICATION", "AWARD_COINS", "CREATE_TASK", "ESCALATE"]),
  conditions: z.string().min(2),
  actionConfig: z.string().min(2),
  active: z.coerce.boolean().optional()
});

export const reportSchema = z.object({
  type: z.enum(["INSTITUTION", "PROGRAM", "DEPARTMENT", "FINANCIAL", "ADMISSIONS", "TRAINER", "STUDENT", "COMMUNITY", "MARKETPLACE", "AI_USAGE"]),
  title: z.string().min(2).max(180),
  summary: z.string().min(2)
});

export const systemSettingSchema = z.object({
  institutionId: z.string().uuid().optional().or(z.literal("")),
  key: z.string().min(2).max(140),
  value: z.string().min(2),
  encrypted: z.coerce.boolean().optional()
});
