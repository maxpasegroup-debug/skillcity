import { DirectorShell } from "@/components/layout/director-shell";
import { requireDirector } from "@/server/director/queries";

export const dynamic = "force-dynamic";

export default async function DirectorLayout({ children }: { children: React.ReactNode }) {
  await requireDirector();
  return <DirectorShell>{children}</DirectorShell>;
}
