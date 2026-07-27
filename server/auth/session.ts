import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createToken, hashToken } from "@/lib/security/token";

const SESSION_COOKIE = "skillcity_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = createToken();
  const tokenHash = hashToken(token);
  const headerStore = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: headerStore.get("user-agent"),
      ipAddress: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          roles: {
            include: { role: true }
          }
        }
      }
    }
  });

  if (!session || session.revokedAt || session.expiresAt < new Date() || session.user.deletedAt) {
    return null;
  }

  return session.user;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}
