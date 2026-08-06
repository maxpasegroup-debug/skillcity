import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdminUser } from "@/server/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser();
  return <AdminShell>{children}</AdminShell>;
}
