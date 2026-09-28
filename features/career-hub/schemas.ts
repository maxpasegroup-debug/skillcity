import { z } from "zod";
import { CAREER_OPPORTUNITY_STATUSES, CAREER_OPPORTUNITY_TYPES, CAREER_OPPORTUNITY_VISIBILITIES, CAREER_WORK_MODES } from "@/lib/career-hub/career";

const optionalUuid = z.string().uuid().optional().or(z.literal(""));
const optionalUrl = z.string().url().optional().or(z.literal(""));
const optionalEmail = z.string().email().optional().or(z.literal(""));

export const careerTalentProfileSchema = z.object({
  headline: z.string().trim().max(180).optional().or(z.literal("")),
  bio: z.string().trim().max(3000).optional().or(z.literal("")),
  skills: z.string().trim().max(1000).optional().or(z.literal("")),
  experienceSummary: z.string().trim().max(3000).optional().or(z.literal("")),
  educationSummary: z.string().trim().max(3000).optional().or(z.literal("")),
  preferredOpportunityTypes: z.string().trim().max(1000).optional().or(z.literal("")),
  workPreference: z.enum(CAREER_WORK_MODES).optional().or(z.literal("")),
  availability: z.enum(["AVAILABLE", "OPEN_TO_OPPORTUNITIES", "NOT_AVAILABLE"]),
  location: z.string().trim().max(180).optional().or(z.literal("")),
  visibility: z.enum(["PRIVATE", "APPLICATION_ONLY", "DISCOVERABLE"])
});

export const careerEmployerSchema = z.object({
  code: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(180),
  publicDescription: z.string().trim().min(10).max(5000),
  websiteUrl: optionalUrl,
  industry: z.string().trim().max(140).optional().or(z.literal("")),
  contactName: z.string().trim().max(160).optional().or(z.literal("")),
  contactEmail: optionalEmail,
  institutionId: z.string().uuid(),
  divisionId: optionalUuid,
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid
});

export const careerEmployerVerificationSchema = z.object({
  employerId: z.string().uuid(),
  status: z.enum(["PENDING", "VERIFIED", "SUSPENDED", "REJECTED"]),
  verificationNote: z.string().trim().max(3000).optional().or(z.literal(""))
});

export const careerOpportunitySchema = z.object({
  employerId: z.string().uuid(),
  ownerEmployeeId: z.string().uuid(),
  code: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2).max(180),
  publicDescription: z.string().trim().min(20).max(10000),
  type: z.enum(CAREER_OPPORTUNITY_TYPES),
  requiredSkills: z.string().trim().max(1000).optional().or(z.literal("")),
  workMode: z.enum(CAREER_WORK_MODES),
  location: z.string().trim().max(180).optional().or(z.literal("")),
  compensationSummary: z.string().trim().max(180).optional().or(z.literal("")),
  applicationDeadline: z.string().optional().or(z.literal("")),
  capacity: z.coerce.number().int().positive().optional().or(z.literal("")),
  status: z.enum(CAREER_OPPORTUNITY_STATUSES),
  visibility: z.enum(CAREER_OPPORTUNITY_VISIBILITIES),
  institutionId: z.string().uuid(),
  divisionId: optionalUuid,
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid
});

export const careerApplicationSchema = z.object({
  opportunityId: z.string().uuid(),
  coverNote: z.string().trim().max(5000).optional().or(z.literal("")),
  referralCode: z.string().trim().max(80).optional().or(z.literal(""))
});

export const careerApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", "SELECTED"]),
  reviewNote: z.string().trim().max(3000).optional().or(z.literal(""))
});

export const careerApplicationWithdrawSchema = z.object({ applicationId: z.string().uuid() });
export const careerReferralSchema = z.object({ opportunityId: z.string().uuid() });
export const careerOpportunityStatusSchema = z.object({
  opportunityId: z.string().uuid(),
  status: z.enum(CAREER_OPPORTUNITY_STATUSES),
  visibility: z.enum(CAREER_OPPORTUNITY_VISIBILITIES)
});
