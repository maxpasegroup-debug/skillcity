import { z } from "zod";
import { PROGRAM_DELIVERY_MODES, PROGRAM_LEARNING_MODELS, SKILL_STUDIO_PROGRAM_TYPES } from "@/lib/skill-studio/program";

const optionalUuid = z.string().uuid().optional().or(z.literal(""));
const optionalDate = z.string().optional().or(z.literal(""));

const programFields = {
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
  description: z.string().trim().min(10),
  durationDays: z.coerce.number().int().positive().max(3650),
  type: z.enum(SKILL_STUDIO_PROGRAM_TYPES),
  deliveryMode: z.enum(PROGRAM_DELIVERY_MODES),
  learningModel: z.enum(PROGRAM_LEARNING_MODELS),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  admissionStatus: z.enum(["OPEN", "CLOSED", "WAITLIST"]),
  institutionId: z.string().uuid(),
  divisionId: z.string().uuid(),
  campusId: optionalUuid,
  departmentId: optionalUuid
};

export const createSkillStudioProgramSchema = z.object(programFields);
export const updateSkillStudioProgramSchema = z.object({ programId: z.string().uuid(), ...programFields });

export const createSkillStudioBatchSchema = z.object({
  programId: z.string().uuid(),
  journeyId: z.string().uuid().optional().or(z.literal("")),
  campusId: optionalUuid,
  name: z.string().trim().min(2).max(160),
  startsAt: optionalDate,
  endsAt: optionalDate,
  enrollmentLimit: z.coerce.number().int().positive().optional().or(z.literal("")),
  deliveryMode: z.enum(PROGRAM_DELIVERY_MODES),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"])
});

export const assignSkillStudioTrainerSchema = z.object({
  batchId: z.string().uuid(),
  trainerId: z.string().uuid(),
  startsAt: optionalDate,
  endsAt: optionalDate
}).refine((value) => !value.startsAt || !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt), {
  message: "Assignment end date must be after its start date."
});
