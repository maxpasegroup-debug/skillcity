import { LabsShell } from "@/components/layout/labs-shell";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function LabsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission(PERMISSIONS.LABS_READ, "/admin-login");
  return <LabsShell>{children}</LabsShell>;
}
