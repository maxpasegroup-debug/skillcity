import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdmissionDashboard, ensureDefaultPipeline } from "@/server/admissions/queries";
import { getCurrentUser } from "@/server/auth/session";

const adminRoles = new Set(["Admin", "Director"]);

export async function requireAdminUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => adminRoles.has(role))) redirect("/dashboard");

  return user;
}

export async function getAdminCommandCenter() {
  await ensureDefaultPipeline();

  const [
    admissions,
    totalApplications,
    approvedWithoutLogin,
    activeStudentLogins,
    temporaryPins,
    expiredPins,
    whatsappMessages,
    openPrograms,
    waitlistPrograms,
    staffUsers
  ] = await Promise.all([
    getAdmissionDashboard(),
    prisma.admissionApplication.count(),
    prisma.admissionApplication.count({
      where: {
        status: "APPROVED",
        studentLoginCredentials: { none: { status: "ACTIVE", revokedAt: null } }
      }
    }),
    prisma.studentLoginCredential.count({ where: { status: "ACTIVE", revokedAt: null, temporary: false, mustResetPin: false } }),
    prisma.studentLoginCredential.count({ where: { status: "ACTIVE", revokedAt: null, OR: [{ temporary: true }, { mustResetPin: true }] } }),
    prisma.studentLoginCredential.count({ where: { status: "EXPIRED" } }),
    prisma.whatsAppMessageLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { application: { include: { lead: true, program: true } }, user: true } }),
    prisma.program.count({ where: { admissionStatus: "OPEN", publicVisible: true, deletedAt: null } }),
    prisma.program.count({ where: { admissionStatus: "WAITLIST", publicVisible: true, deletedAt: null } }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        roles: { some: { role: { name: { in: ["Admission", "Business Development", "Director", "Admin"] } } } }
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { roles: { include: { role: true } } }
    })
  ]);

  return {
    admissions,
    stats: {
      totalApplications,
      approvedWithoutLogin,
      activeStudentLogins,
      temporaryPins,
      expiredPins,
      openPrograms,
      waitlistPrograms
    },
    whatsappMessages,
    staffUsers
  };
}
