import { z } from "zod";

export const leadAssignmentSchema = z.object({
  leadId: z.string().uuid(),
  assignedToId: z.string().uuid().optional().or(z.literal(""))
});

export const leadFollowUpSchema = z.object({
  leadId: z.string().uuid(),
  scheduledAt: z.string().min(1),
  subject: z.string().trim().min(2).max(180),
  note: z.string().trim().min(2).max(2000)
});
