import { AdmissionsShell } from "@/components/layout/admissions-shell";
import { requireAdmissionUser } from "@/server/admissions/queries";

export const dynamic = "force-dynamic";

export default async function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  await requireAdmissionUser();
  return <AdmissionsShell>{children}</AdmissionsShell>;
}
