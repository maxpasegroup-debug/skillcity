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

export const whatsappPinLoginSchema = z.object({
  whatsapp: z.string().trim().min(7, "Enter your WhatsApp number").max(40),
  pin: z.string().trim().regex(/^[0-9]{6}$/, "Enter the 6 digit PIN from Admission Cell")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email").toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, "Reset link is invalid"),
  password: passwordSchema
});

export const resetPinSchema = z
  .object({
    pin: z.string().trim().regex(/^[0-9]{6}$/, "Choose a 6 digit PIN"),
    confirmPin: z.string().trim().regex(/^[0-9]{6}$/, "Confirm your 6 digit PIN")
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PIN confirmation must match",
    path: ["confirmPin"]
  });

export const studentActivationProfileSchema = z.object({
  whatsapp: z.string().trim().min(7, "Enter your WhatsApp number").max(40),
  city: z.string().trim().min(2, "Enter your city").max(120),
  state: z.string().trim().min(2, "Enter your state").max(120),
  educationOrWork: z.string().trim().min(2, "Select your current status").max(180),
  learningGoal: z.string().trim().min(10, "Tell us your learning goal").max(1200),
  preferredLanguage: z.string().trim().min(2, "Select preferred language").max(80),
  availability: z.string().trim().min(2, "Select your availability").max(160),
  guardianName: z.string().trim().max(160).optional(),
  guardianPhone: z.string().trim().max(40).optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type WhatsAppPinLoginInput = z.infer<typeof whatsappPinLoginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPinInput = z.infer<typeof resetPinSchema>;
export type StudentActivationProfileInput = z.infer<typeof studentActivationProfileSchema>;
