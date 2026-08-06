import { z } from "zod";
import { launchPrograms } from "@/config/launch-programs";

const programSlugs = launchPrograms.map((program) => program.slug) as [string, ...string[]];

export const publicApplicationSchema = z.object({
  programSlug: z.enum(programSlugs),
  name: z.string().trim().min(2, "Enter your full name.").max(160),
  phone: z.string().trim().min(7, "Enter a valid phone number.").max(40),
  whatsapp: z.string().trim().min(7, "Enter a valid WhatsApp number.").max(40),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter your city.").max(120),
  state: z.string().trim().min(2, "Enter your state.").max(120),
  educationOrWork: z.string().trim().min(2, "Tell us your current education or work status.").max(180),
  goal: z.string().trim().min(10, "Write one clear sentence about your goal.").max(500),
  preferredCounsellingTime: z.string().trim().min(2, "Choose a preferred counselling time.").max(120),
  referralId: z.string().uuid().optional().or(z.literal(""))
});

export const applicationStatusSchema = z.object({
  whatsapp: z.string().trim().min(7, "Enter the WhatsApp number used in your application.").max(40)
});

export type PublicApplicationInput = z.infer<typeof publicApplicationSchema>;
export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;
