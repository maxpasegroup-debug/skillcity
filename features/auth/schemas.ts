import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Add one uppercase letter")
  .regex(/[a-z]/, "Add one lowercase letter")
  .regex(/[0-9]/, "Add one number");

export const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(120),
  email: z.string().email("Enter a valid email").toLowerCase(),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Enter your password")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Reset link is invalid"),
  password: passwordSchema
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
