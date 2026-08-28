"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { createSession, revokeCurrentSession } from "@/server/auth/session";
import { requireAdminUser } from "@/server/admin/queries";
import { adminLoginSchema, adminPinChangeSchema, adminResetAccessSchema, adminRoleChangeSchema, adminUserStatusSchema } from "@/features/admin/schemas";

type State = { ok: boolean; message: string };

const INITIAL_ADMIN_MOBILE = "8089239823";
const INITIAL_ADMIN_EMAIL = "8089239823@admin.airaskillcity.local";
const INITIAL_ADMIN_PIN_HASH = "$2b$12$xulQe.XHJMquULYxgZMOLOLbY4R2DQ701ifsaj0LcJAjlXgseZx.6";

function normalizeMobile(value: string) {
  return value.replace(/\D/g, "");
}

function adminEmailForMobile(mobile: string) {
  return `${normalizeMobile(mobile)}@admin.airaskillcity.local`;
}

async function ensureInitialAdmin() {
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin", description: "Full administrative access" }
  });

  const directorRole = await prisma.role.upsert({
    where: { name: "Director" },
    update: {},
    create: { name: "Director", description: "Director access" }
  });

  const user = await prisma.user.upsert({
    where: { email: INITIAL_ADMIN_EMAIL },
    update: {},
    create: {
      name: "AIRA Skill City Admin",
      email: INITIAL_ADMIN_EMAIL,
      passwordHash: INITIAL_ADMIN_PIN_HASH,
      status: "ACTIVE"
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: directorRole.id } },
    update: {},
    create: { userId: user.id, roleId: directorRole.id }
  });

  return user;
}

export async function adminLoginAction(_: State, formData: FormData): Promise<State> {
  const parsed = adminLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Mobile number or PIN is incorrect." };

  const mobile = normalizeMobile(parsed.data.mobile);
  const limited = checkRateLimit(`admin-login:${mobile}`, 5, 15 * 60_000);
  if (!limited.allowed) return { ok: false, message: "Too many attempts. Please wait and try again." };

  if (mobile === INITIAL_ADMIN_MOBILE) {
    await ensureInitialAdmin();
  }

  const user = await prisma.user.findUnique({
    where: { email: adminEmailForMobile(mobile) },
    include: { roles: { include: { role: true } } }
  });

  const roles = user?.roles.map((item) => item.role.name) ?? [];
  const valid = user && !user.deletedAt && user.status === "ACTIVE" && roles.some((role) => role === "Admin" || role === "Director") && await verifyPassword(parsed.data.pin, user.passwordHash);

  if (!valid) {
    await prisma.auditLog.create({ data: { action: "ADMIN_LOGIN_FAILED", entity: "User", metadata: { mobile } } });
    return { ok: false, message: "Mobile number or PIN is incorrect." };
  }

  await prisma.auditLog.create({ data: { userId: user.id, action: "ADMIN_LOGIN", entity: "User", entityId: user.id } });
  await createSession(user.id);
  redirect("/admin/dashboard");
}

export async function changeAdminPinAction(_: State, formData: FormData): Promise<State> {
  const actor = await requireAdminUser();
  const parsed = adminPinChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check PIN details." };

  const currentValid = await verifyPassword(parsed.data.currentPin, actor.passwordHash);
  if (!currentValid) return { ok: false, message: "Current PIN is incorrect." };

  const newHash = await hashPassword(parsed.data.newPin);
  await prisma.$transaction([
    prisma.user.update({ where: { id: actor.id }, data: { passwordHash: newHash } }),
    prisma.session.updateMany({ where: { userId: actor.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId: actor.id, action: "ADMIN_PIN_CHANGED", entity: "User", entityId: actor.id } })
  ]);

  await revokeCurrentSession();
  redirect("/admin-login");
}

export async function assignUserRoleAction(formData: FormData) {
  const actor = await requireAdminUser();
  const parsed = adminRoleChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.userId === actor.id) return;

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: parsed.data.userId, roleId: parsed.data.roleId } },
    update: {},
    create: { userId: parsed.data.userId, roleId: parsed.data.roleId }
  });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "ADMIN_ROLE_ASSIGNED", entity: "User", entityId: parsed.data.userId, metadata: { roleId: parsed.data.roleId } } });
  revalidatePath("/admin/users");
}

export async function updateUserStatusAction(formData: FormData) {
  const actor = await requireAdminUser();
  const parsed = adminUserStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.userId === actor.id) return;

  await prisma.$transaction([
    prisma.user.update({ where: { id: parsed.data.userId }, data: { status: parsed.data.status } }),
    prisma.session.updateMany({ where: { userId: parsed.data.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId: actor.id, action: `ADMIN_USER_${parsed.data.status}`, entity: "User", entityId: parsed.data.userId } })
  ]);
  revalidatePath("/admin/users");
}

export async function resetUserAccessAction(formData: FormData) {
  const actor = await requireAdminUser();
  const parsed = adminResetAccessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.userId === actor.id) return;

  await prisma.$transaction([
    prisma.session.updateMany({ where: { userId: parsed.data.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.studentLoginCredential.updateMany({ where: { userId: parsed.data.userId, revokedAt: null }, data: { status: "REVOKED", revokedAt: new Date() } }),
    prisma.auditLog.create({ data: { userId: actor.id, action: "ADMIN_USER_ACCESS_RESET", entity: "User", entityId: parsed.data.userId } })
  ]);
  revalidatePath("/admin/users");
  revalidatePath("/admin/access");
}
