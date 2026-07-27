import { CommunityShell } from "@/components/layout/community-shell";
import { requireCommunityUser } from "@/server/community/queries";

export const dynamic = "force-dynamic";

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  await requireCommunityUser();
  return <CommunityShell>{children}</CommunityShell>;
}
