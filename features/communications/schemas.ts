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
