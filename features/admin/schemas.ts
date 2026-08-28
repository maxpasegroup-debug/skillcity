import { z } from "zod";

export const adminLoginSchema = z.object({
  mobile: z.string().trim().min(7, "Enter your mobile number.").max(20),
  pin: z.string().trim().min(4, "Enter your PIN.").max(12)
});

export const adminPinChangeSchema = z.object({
  currentPin: z.string().trim().min(4, "Enter your current PIN.").max(12),
  newPin: z.string().trim().regex(/^[0-9]{6,12}$/, "Use a 6 to 12 digit PIN."),
  confirmPin: z.string().trim()
}).refine((data) => data.newPin === data.confirmPin, {
  path: ["confirmPin"],
  message: "New PIN and confirmation must match."
});

export const adminRoleChangeSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid()
});

export const adminUserStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["ACTIVE", "SUSPENDED"])
});

export const adminResetAccessSchema = z.object({
  userId: z.string().uuid()
});
