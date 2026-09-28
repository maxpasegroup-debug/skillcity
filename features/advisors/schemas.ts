import { z } from "zod";

const optionalUuid = z.string().uuid().optional().or(z.literal(""));
const dateTime = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");
const optionalDateTime = dateTime.optional().or(z.literal(""));

export const advisorAssignmentSchema = z.object({
  advisorId: z.string().uuid(),
  targetType: z.enum(["STUDENT", "BATCH"]),
  studentId: optionalUuid,
  batchId: optionalUuid,
  startsAt: dateTime,
  endsAt: optionalDateTime
}).superRefine((value, context) => {
  const hasStudent = Boolean(value.studentId);
  const hasBatch = Boolean(value.batchId);
  if (value.targetType === "STUDENT" && (!hasStudent || hasBatch)) {
    context.addIssue({ code: "custom", message: "Choose exactly one student target." });
  }
  if (value.targetType === "BATCH" && (!hasBatch || hasStudent)) {
    context.addIssue({ code: "custom", message: "Choose exactly one batch target." });
  }
  if (value.endsAt && new Date(value.endsAt) <= new Date(value.startsAt)) {
    context.addIssue({ code: "custom", message: "Assignment end date must be after its start date." });
  }
});

export const endAdvisorAssignmentSchema = z.object({
  assignmentId: z.string().uuid()
});
