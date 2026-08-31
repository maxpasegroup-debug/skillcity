import { z } from "zod";
import { careerCategories, careerRoles } from "@/features/careers/catalog";

const roleSlugs = careerRoles.map((role) => role.slug) as [string, ...string[]];
const categorySlugs = careerCategories.map((category) => category.slug) as [string, ...string[]];

export const careerApplicationSchema = z.object({
  roleSlug: z.enum(roleSlugs),
  categorySlug: z.enum(categorySlugs),
  candidateName: z.string().trim().min(2, "Enter your name.").max(160),
  mobile: z.string().trim().min(7, "Enter a valid mobile number.").max(40),
  whatsapp: z.string().trim().min(7, "Enter a valid WhatsApp number.").max(40),
  email: z.string().trim().email("Enter a valid email.").max(255),
  district: z.string().trim().min(2, "Enter your district.").max(120),
  education: z.string().trim().min(2, "Share your education.").max(180),
  experience: z.string().trim().max(500).optional().or(z.literal("")),
  currentStatus: z.string().trim().min(2, "Share your current status.").max(180),
  relevantSkills: z.string().trim().max(500).optional().or(z.literal("")),
  resumeUrl: z.string().trim().url("Enter a valid resume link.").max(600).optional().or(z.literal("")),
  profileUrl: z.string().trim().url("Enter a valid profile link.").max(600).optional().or(z.literal("")),
  shortIntro: z.string().trim().min(10, "Write a short introduction.").max(900),
  availability: z.string().trim().min(2, "Share your availability.").max(120),
  preferredLocation: z.string().trim().min(2, "Enter preferred location.").max(120),
  consent: z.literal("on", { message: "Consent is required." })
});

export const careerStageUpdateSchema = z.object({
  applicationId: z.string().uuid(),
  stage: z.enum([
    "NEW_APPLICATION",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "INTERVIEW_COMPLETED",
    "SELECTED",
    "OFFER_SENT",
    "OFFER_ACCEPTED",
    "JOINED",
    "TRAINING",
    "ACTIVE",
    "REJECTED",
    "ON_HOLD"
  ]),
  note: z.string().trim().max(700).optional().or(z.literal(""))
});

export const careerNoteSchema = z.object({
  applicationId: z.string().uuid(),
  note: z.string().trim().min(2, "Add a note.").max(900)
});

export const interviewSchema = z.object({
  applicationId: z.string().uuid(),
  interviewerId: z.string().uuid().optional().or(z.literal("")),
  scheduledAt: z.string().trim().min(1, "Choose interview time."),
  mode: z.string().trim().min(2).max(80),
  meetingLink: z.string().trim().url().max(600).optional().or(z.literal("")),
  notes: z.string().trim().max(700).optional().or(z.literal(""))
});

export const interviewResultSchema = z.object({
  interviewId: z.string().uuid(),
  result: z.string().trim().min(2).max(80),
  feedback: z.string().trim().max(900).optional().or(z.literal(""))
});

export const rmDevelopmentStartSchema = z.object({
  developmentId: z.string().uuid(),
  employeeId: z.string().uuid("Select the Relationship Manager employee."),
  developmentStart: z.string().trim().min(1, "Choose a start date."),
  targetAdmissions: z.coerce.number().int().min(1).max(1000).default(120)
});

export const rmDevelopmentTargetSchema = z.object({
  developmentId: z.string().uuid(),
  targetAdmissions: z.coerce.number().int().min(1).max(1000),
  note: z.string().trim().max(700).optional().or(z.literal(""))
});

export const rmEvaluationSchema = z.object({
  developmentId: z.string().uuid(),
  status: z.enum(["IN_PROGRESS", "EVALUATION_PENDING", "ELIGIBLE", "NOT_ELIGIBLE", "COMPLETED"]),
  finalDecision: z.string().trim().min(2).max(180),
  evaluationNotes: z.string().trim().min(2).max(1200)
});
