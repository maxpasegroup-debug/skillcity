import { TelecallerShell } from "@/components/layout/telecaller-shell";
import { requireTelecallerUser } from "@/server/admissions/queries";

export const dynamic = "force-dynamic";

export default async function TelecallerLayout({ children }: { children: React.ReactNode }) {
  await requireTelecallerUser();
  return <TelecallerShell>{children}</TelecallerShell>;
}
