import { z } from "zod";
import { AUTOMATION_RECIPIENT_KEYS, COMMUNICATION_CHANNELS, COMMUNICATION_PURPOSES, DOMAIN_EVENT_TYPES } from "@/lib/communications/policies";

const optionalUuid = z.string().uuid().optional().or(z.literal(""));

export const communicationTemplateSchema = z.object({
  institutionId: z.string().uuid(),
  divisionId: optionalUuid,
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid,
  code: z.string().min(2).max(120),
  name: z.string().min(2).max(180),
  channel: z.enum(COMMUNICATION_CHANNELS),
  purpose: z.enum(COMMUNICATION_PURPOSES),
  subject: z.string().max(220).optional(),
  body: z.string().min(1).max(20_000),
  providerTemplateId: z.string().max(180).optional(),
  locale: z.string().min(2).max(20).default("en")
});

export const eventAutomationSchema = z.object({
  institutionId: z.string().uuid(),
  divisionId: optionalUuid,
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid,
  code: z.string().min(2).max(120),
  name: z.string().min(2).max(180),
  description: z.string().max(1_000).optional(),
  eventType: z.enum(DOMAIN_EVENT_TYPES),
  recipientPayloadKey: z.enum(AUTOMATION_RECIPIENT_KEYS),
  title: z.string().min(2).max(180),
  message: z.string().min(2).max(2_000),
  actionUrl: z.string().max(500).optional(),
  maxAttempts: z.coerce.number().int().min(1).max(5).default(3)
});

export const processEventsSchema = z.object({ limit: z.coerce.number().int().min(1).max(25).default(10) });

export const internalChannelSchema = z.object({
  institutionId: z.string().uuid(),
  divisionId: optionalUuid,
  districtId: optionalUuid,
  campusId: optionalUuid,
  departmentId: optionalUuid,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["TEAM", "ANNOUNCEMENT"]),
  memberIds: z.array(z.string().uuid()).max(100).default([])
});

export const internalMessageSchema = z.object({
  channelId: z.string().uuid(),
  body: z.string().trim().min(1).max(5_000)
});

export const internalChannelMemberSchema = z.object({
  channelId: z.string().uuid(),
  userId: z.string().uuid()
});

export const internalChannelMemberRoleSchema = internalChannelMemberSchema.extend({
  role: z.enum(["MODERATOR", "MEMBER"])
});

export const internalChannelIdSchema = z.object({ channelId: z.string().uuid() });
