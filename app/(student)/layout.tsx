import { redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user) {
    const isStudent = user.roles.some((item) => item.role.name === "Student");
    const temporaryCredential = await prisma.studentLoginCredential.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        revokedAt: null,
        OR: [{ temporary: true }, { mustResetPin: true }]
      },
      select: { id: true }
    });

    if (temporaryCredential) redirect("/reset-pin");

    if (isStudent) {
      const activationProfile = await prisma.studentActivationProfile.findUnique({
        where: { studentId: user.id },
        select: { completedAt: true }
      });

      if (!activationProfile?.completedAt) redirect("/profile-setup");
    }
  }

  return <StudentShell>{children}</StudentShell>;
}
