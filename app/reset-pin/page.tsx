import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPinForm } from "@/features/auth/components/reset-pin-form";
import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reset PIN"
};

export default async function ResetPinPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const credential = await prisma.studentLoginCredential.findFirst({
    where: { userId: user.id, status: "ACTIVE", revokedAt: null },
    orderBy: { createdAt: "desc" }
  });

  if (!credential) redirect("/dashboard");
  if (!credential.mustResetPin && !credential.temporary) redirect("/dashboard");

  return (
    <AuthShell title="Create your private PIN" subtitle="NEXA AI has completed your approval handoff. Set a new PIN before entering your dashboard.">
      <ResetPinForm />
    </AuthShell>
  );
}
