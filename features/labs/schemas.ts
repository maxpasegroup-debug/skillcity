import { z } from "zod";
import { LABS_PRODUCT_LIFECYCLES, LABS_PRODUCT_TYPES } from "@/lib/labs/product";

const optionalUuid = z.string().uuid().optional().or(z.literal(""));
const dateTime = z.string().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date and time.");

const productFields = {
  name: z.string().trim().min(2).max(180),
  code: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
  description: z.string().trim().min(10),
  type: z.enum(LABS_PRODUCT_TYPES),
  lifecycle: z.enum(LABS_PRODUCT_LIFECYCLES),
  institutionId: z.string().uuid(),
  divisionId: z.string().uuid(),
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid
};

export const createLabsProductSchema = z.object({ ...productFields, ownerId: z.string().uuid() });
export const updateLabsProductSchema = z.object({ productId: z.string().uuid(), ...productFields });

export const labsContributorSchema = z.object({
  productId: z.string().uuid(),
  employeeId: z.string().uuid(),
  responsibility: z.string().trim().min(2).max(140),
  startsAt: dateTime,
  endsAt: dateTime.optional().or(z.literal(""))
}).refine((value) => !value.endsAt || new Date(value.endsAt) > new Date(value.startsAt), { message: "Assignment end date must be after its start date." });

export const replaceLabsOwnerSchema = z.object({ productId: z.string().uuid(), employeeId: z.string().uuid() });
export const endLabsAssignmentSchema = z.object({ productId: z.string().uuid(), assignmentId: z.string().uuid() });
