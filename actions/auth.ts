"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { createOtp, createToken, hashToken } from "@/lib/security/token";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/features/auth/schemas";
import { createSession, revokeCurrentSession } from "@/server/auth/session";
import { sendEmail } from "@/server/email/provider";
import { otpEmail, resetPasswordEmail, welcomeEmail } from "@/emails/templates";
import { siteConfig } from "@/config/site";

type ActionState = {
  ok: boolean;
  message: string;
};

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your details" };
  }

  const limited = checkRateLimit(`register:${parsed.data.email}`, 3, 60_000);
  if (!limited.allowed) {
    return { ok: false, message: "Please wait a minute and try again." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing && !existing.deletedAt) {
    return { ok: false, message: "An account already exists for this email." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const otp = createOtp();
  const otpHash = hashToken(otp);
  const studentRole = await prisma.role.upsert({
    where: { name: "Student" },
    update: {},
    create: { name: "Student", description: "Learner account" }
  });

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      roles: { create: { roleId: studentRole.id } },
      emailOtps: {
        create: {
          email: parsed.data.email,
          codeHash: otpHash,
          purpose: "EMAIL_VERIFICATION",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      },
      auditLogs: {
        create: { action: "USER_REGISTERED", entity: "User" }
      }
    }
  });

  await sendEmail({ to: user.email, ...otpEmail(otp) });
  await sendEmail({ to: user.email, ...welcomeEmail(user.name) });
  await createSession(user.id);
  redirect("/");
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your details" };
  }

  const limited = checkRateLimit(`login:${parsed.data.email}`, 5, 60_000);
  if (!limited.allowed) {
    return { ok: false, message: "Too many attempts. Please wait a minute." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.deletedAt || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, message: "Email or password is incorrect." };
  }

  if (user.status === "SUSPENDED") {
    return { ok: false, message: "This account is currently unavailable." };
  }

  await prisma.auditLog.create({ data: { userId: user.id, action: "USER_LOGGED_IN", entity: "User", entityId: user.id } });
  await createSession(user.id);
  redirect("/");
}

export async function forgotPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  }

  const limited = checkRateLimit(`forgot:${parsed.data.email}`, 3, 60_000);
  if (!limited.allowed) {
    return { ok: false, message: "Please wait a minute and try again." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && !user.deletedAt) {
    const token = createToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });
    await sendEmail({
      to: user.email,
      ...resetPasswordEmail(`${siteConfig.url}/reset-password?token=${token}`)
    });
  }

  return { ok: true, message: "If an account exists, a secure reset link has been sent." };
}

export async function resetPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your new password" };
  }

  const tokenHash = hashToken(parsed.data.token);
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return { ok: false, message: "This reset link is invalid or expired." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash: await hashPassword(parsed.data.password), status: "ACTIVE" }
    }),
    prisma.passwordResetToken.update({
      where: { id: reset.id },
      data: { usedAt: new Date() }
    }),
    prisma.session.updateMany({
      where: { userId: reset.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    }),
    prisma.auditLog.create({
      data: { userId: reset.userId, action: "PASSWORD_RESET_COMPLETED", entity: "User", entityId: reset.userId }
    })
  ]);

  return { ok: true, message: "Password updated. You can login now." };
}

export async function logoutAction() {
  await revokeCurrentSession();
  redirect("/");
}
