import { z } from "zod";

const optionalUuid = z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional());
const optionalDate = z.preprocess((value) => value === "" ? undefined : value, z.coerce.date().optional());
const employeeCode = z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/, "Use letters, numbers, dots, slashes, underscores or hyphens.");

export const employmentStatuses = ["ACTIVE", "PROBATION", "ON_LEAVE", "ON_NOTICE", "INACTIVE", "EXITED"] as const;
export const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"] as const;

const employeeFields = {
  employeeCode,
  designationId: z.string().uuid(),
  managerId: optionalUuid,
  institutionId: z.string().uuid(),
  divisionId: optionalUuid,
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid,
  employmentType: z.enum(employmentTypes),
  status: z.enum(employmentStatuses),
  joinedAt: optionalDate,
  exitedAt: optionalDate
};

function validEmploymentDates(data: { joinedAt?: Date; exitedAt?: Date }, context: z.RefinementCtx) {
  if (data.joinedAt && data.exitedAt && data.exitedAt < data.joinedAt) {
    context.addIssue({ code: "custom", path: ["exitedAt"], message: "Exit date cannot be before joining date." });
  }
}

export const createEmployeeSchema = z.object({
  userEmail: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  ...employeeFields
}).superRefine(validEmploymentDates);

export const updateEmployeeSchema = z.object({
  employeeId: z.string().uuid(),
  ...employeeFields
}).superRefine(validEmploymentDates);

export const employeeAssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  institutionId: z.string().uuid(),
  divisionId: optionalUuid,
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid,
  designationId: optionalUuid,
  startsAt: z.coerce.date(),
  endsAt: optionalDate
}).superRefine((data, context) => {
  if (data.endsAt && data.endsAt <= data.startsAt) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "Assignment end must be after its start." });
  }
});

export const endEmployeeAssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  assignmentId: z.string().uuid()
});

export const deactivateEmployeeSchema = z.object({
  employeeId: z.string().uuid(),
  exitedAt: z.coerce.date()
});

export function normalizeEmployeeCode(value: string) {
  return value.trim().toUpperCase();
}
