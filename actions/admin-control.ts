"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { createSession, revokeCurrentSession } from "@/server/auth/session";
import { requireAdminUser } from "@/server/admin/queries";
import { adminLoginSchema, adminPinChangeSchema, adminResetAccessSchema, adminRoleChangeSchema, adminUserStatusSchema } from "@/features/admin/schemas";

type State = { ok: boolean; message: string };

function normalizeMobile(value: string) {
  return value.replace(/\D/g, "");
}

function adminEmailForMobile(mobile: string) {
  return `${normalizeMobile(mobile)}@admin.airaskillcity.local`;
}

function initialAdminConfig() {
  const mobile = process.env.INITIAL_ADMIN_MOBILE ? normalizeMobile(process.env.INITIAL_ADMIN_MOBILE) : "";
  const pinHash = process.env.INITIAL_ADMIN_PIN_HASH?.trim() ?? "";
  if (!mobile || !pinHash.startsWith("$2")) return null;
  return {
    mobile,
    pinHash,
    email: process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase() || adminEmailForMobile(mobile)
  };
}

async function ensureInitialAdmin(config: NonNullable<ReturnType<typeof initialAdminConfig>>) {
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
    where: { email: config.email },
    update: {
      status: "ACTIVE",
      deletedAt: null
    },
    create: {
      name: "AIRA Skill City Admin",
      email: config.email,
      passwordHash: config.pinHash,
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

  const bootstrap = initialAdminConfig();
  if (bootstrap && mobile === bootstrap.mobile) {
    await ensureInitialAdmin(bootstrap);
  }

  const user = await prisma.user.findUnique({
    where: { email: bootstrap && mobile === bootstrap.mobile ? bootstrap.email : adminEmailForMobile(mobile) },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  });

  const roles = user?.roles.map((item) => item.role.name) ?? [];
  const valid = user && !user.deletedAt && user.status === "ACTIVE" && hasPermission(user, PERMISSIONS.ADMIN_ACCESS) && await verifyPassword(parsed.data.pin, user.passwordHash);

  if (!valid) {
    await prisma.auditLog.create({ data: { action: "ADMIN_LOGIN_FAILED", entity: "User", metadata: { mobile } } });
    return { ok: false, message: "Mobile number or PIN is incorrect." };
  }

  await prisma.auditLog.create({ data: { userId: user.id, action: "ADMIN_LOGIN", entity: "User", entityId: user.id } });
  await createSession(user.id);
  redirect(roles.includes("Director") ? "/director/dashboard" : "/admin/dashboard");
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
