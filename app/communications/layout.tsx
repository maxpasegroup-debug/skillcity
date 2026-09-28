import { CommunicationsShell } from "@/components/layout/communications-shell";
import { requireCommunications } from "@/server/communications/queries";

export const dynamic = "force-dynamic";

export default async function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  await requireCommunications();
  return <CommunicationsShell>{children}</CommunicationsShell>;
}
