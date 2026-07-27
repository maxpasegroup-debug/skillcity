import { ExecutiveShell } from "@/components/layout/executive-shell";
import { requireExecutive } from "@/server/executive/queries";

export const dynamic = "force-dynamic";

export default async function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  await requireExecutive();
  return <ExecutiveShell>{children}</ExecutiveShell>;
}
