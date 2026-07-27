import { BdmShell } from "@/components/layout/bdm-shell";
import { requireBdmUser } from "@/server/admissions/queries";

export const dynamic = "force-dynamic";

export default async function BdmLayout({ children }: { children: React.ReactNode }) {
  await requireBdmUser();
  return <BdmShell>{children}</BdmShell>;
}
