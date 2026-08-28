import { CounsellorShell } from "@/components/layout/counsellor-shell";
import { requireCounsellorUser } from "@/server/admissions/queries";

export const dynamic = "force-dynamic";

export default async function CounsellorLayout({ children }: { children: React.ReactNode }) {
  await requireCounsellorUser();
  return <CounsellorShell>{children}</CounsellorShell>;
}
