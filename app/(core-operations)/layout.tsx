import { redirect } from "next/navigation";
import { CoreOperationsShell } from "@/components/layout/core-operations-shell";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function CoreOperationsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const access = { documents: hasPermission(user, PERMISSIONS.DOCUMENTS_READ), compliance: hasPermission(user, PERMISSIONS.COMPLIANCE_READ), finance: hasPermission(user, PERMISSIONS.FINANCE_READ) };
  if (!Object.values(access).some(Boolean)) redirect("/dashboard");
  return <CoreOperationsShell access={access}>{children}</CoreOperationsShell>;
}
