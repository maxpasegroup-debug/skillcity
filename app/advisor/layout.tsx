import { AdvisorShell } from "@/components/layout/advisor-shell";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.ADVISOR_READ);
  return <AdvisorShell>{children}</AdvisorShell>;
}
