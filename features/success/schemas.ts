import { z } from "zod";

export const portfolioSchema = z.object({
  headline: z.string().max(180).optional(),
  bio: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["PRIVATE", "PUBLIC", "UNLISTED"])
});

export const projectSchema = z.object({
  title: z.string().min(2).max(180),
  description: z.string().min(2),
  demoUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  techStack: z.string().optional(),
  tags: z.string().optional(),
  completedAt: z.string().optional(),
  featured: z.coerce.boolean().optional()
});

export const resumeSchema = z.object({
  type: z.enum(["PROFESSIONAL", "FOUNDER", "DEVELOPER"]),
  headline: z.string().max(180).optional(),
  summary: z.string().optional()
});

export const placementSchema = z.object({
  status: z.enum(["NOT_READY", "PREPARING", "READY", "INTERVIEWING", "OFFERED", "PLACED"]),
  readinessScore: z.coerce.number().int().min(0).max(100),
  preferredRole: z.string().optional(),
  preferredLocation: z.string().optional(),
  salaryExpectation: z.string().optional(),
  mentorNotes: z.string().optional()
});

export const placementApplicationSchema = z.object({
  company: z.string().min(2).max(180),
  role: z.string().min(2).max(180),
  status: z.enum(["DRAFT", "APPLIED", "SHORTLISTED", "INTERVIEW", "OFFER", "REJECTED", "ACCEPTED"]),
  interviewAt: z.string().optional(),
  offerAmount: z.string().optional(),
  notes: z.string().optional()
});

export const internshipSchema = z.object({
  company: z.string().min(2).max(180),
  role: z.string().min(2).max(180),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]),
  feedback: z.string().optional()
});

export const founderProfileSchema = z.object({
  businessName: z.string().optional(),
  industry: z.string().optional(),
  revenueStage: z.enum(["IDEA", "VALIDATION", "PRE_REVENUE", "REVENUE", "GROWTH"]),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  pitchDeckUrl: z.string().url().optional().or(z.literal("")),
  traction: z.string().optional(),
  customers: z.string().optional()
});
