import { RelationshipManagerShell } from "@/components/layout/rm-shell";
import { requireRelationshipManagerUser } from "@/server/careers/queries";

export const dynamic = "force-dynamic";

export default async function RelationshipManagerLayout({ children }: { children: React.ReactNode }) {
  await requireRelationshipManagerUser();
  return <RelationshipManagerShell>{children}</RelationshipManagerShell>;
}
