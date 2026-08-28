import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { StudentActivationProfileForm } from "@/features/auth/components/student-activation-profile-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Complete Profile"
};

export default async function ProfileSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const credential = await prisma.studentLoginCredential.findFirst({
    where: { userId: user.id, status: "ACTIVE", revokedAt: null },
    orderBy: { createdAt: "desc" },
    include: { application: { include: { lead: true } } }
  });

  if (credential?.temporary || credential?.mustResetPin) redirect("/reset-pin");

  const profile = await prisma.studentActivationProfile.findUnique({ where: { studentId: user.id } });
  if (profile?.completedAt) redirect("/dashboard");

  const applicationData = credential?.application?.data as Record<string, string> | null;
  const lead = credential?.application?.lead;

  return (
    <AuthShell
      title="Complete your student profile"
      subtitle="One calm setup before your Skill City dashboard opens. Your admissions details are already prefilled where available."
    >
      <StudentActivationProfileForm
        defaults={{
          whatsapp: profile?.whatsapp ?? credential?.whatsapp ?? lead?.whatsapp ?? lead?.phone,
          city: profile?.city ?? lead?.city,
          state: profile?.state ?? lead?.state,
          educationOrWork: profile?.educationOrWork ?? applicationData?.educationOrWork,
          learningGoal: profile?.learningGoal ?? applicationData?.goal,
          preferredLanguage: profile?.preferredLanguage,
          availability: profile?.availability ?? applicationData?.preferredCounsellingTime,
          guardianName: profile?.guardianName,
          guardianPhone: profile?.guardianPhone
        }}
      />
    </AuthShell>
  );
}
