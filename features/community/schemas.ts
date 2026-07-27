import { z } from "zod";

export const postSchema = z.object({
  groupId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  content: z.string().min(2),
  type: z.enum(["UPDATE", "PROJECT_MILESTONE", "ACHIEVEMENT", "QUESTION", "RESOURCE"]),
  resourceUrl: z.string().url().optional().or(z.literal("")),
  tags: z.string().optional()
});

export const groupSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().optional(),
  type: z.enum(["BATCH", "PROGRAM", "INTEREST", "FOUNDER_CLUB", "CODING_CLUB", "AI_CLUB", "PLACEMENT_CLUB"])
});

export const eventSchema = z.object({
  groupId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  description: z.string().optional(),
  type: z.enum(["WORKSHOP", "LIVE_SESSION", "HACKATHON", "MEETUP", "BOOTCAMP", "CAREER_FAIR", "GUEST_LECTURE"]),
  capacity: z.coerce.number().int().positive().optional(),
  startsAt: z.string().min(1),
  meetingLink: z.string().url().optional().or(z.literal(""))
});

export const challengeSchema = z.object({
  groupId: z.string().uuid().optional().or(z.literal("")),
  title: z.string().min(2).max(180),
  description: z.string().min(2),
  rewardXp: z.coerce.number().int().min(0),
  rewardCoins: z.coerce.number().int().min(0)
});

export const listingSchema = z.object({
  categoryName: z.string().min(2).max(120),
  type: z.enum(["TEMPLATE", "PROJECT", "PROMPT_PACK", "DESIGN_ASSET", "LEARNING_RESOURCE", "SERVICE"]),
  title: z.string().min(2).max(180),
  description: z.string().min(2),
  url: z.string().url().optional().or(z.literal("")),
  priceCoins: z.coerce.number().int().min(0)
});
