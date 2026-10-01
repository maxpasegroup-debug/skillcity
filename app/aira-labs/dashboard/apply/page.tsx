import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { NexaOnboardingModal } from "@/features/apply/components/nexa-onboarding-modal";
import { getCurrentUser } from "@/server/auth/session";

export default async function LabsAccountApplicationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/aira-labs/sign-in");
  if (!hasPermission(user, PERMISSIONS.LABS_PORTAL_ACCESS)) redirect("/workspace");
  return <main className="min-h-screen bg-[#111814]"><NexaOnboardingModal standalone initialProgramSlug="aira-labs" closeHref="/aira-labs/dashboard" accountIdentity={{ name: user.name, email: user.email }} /></main>;
}
