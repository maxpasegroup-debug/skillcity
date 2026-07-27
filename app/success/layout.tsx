import { SuccessShell } from "@/components/layout/success-shell";
import { requireSuccessStudent } from "@/server/success/queries";

export const dynamic = "force-dynamic";

export default async function SuccessLayout({ children }: { children: React.ReactNode }) {
  await requireSuccessStudent();
  return <SuccessShell>{children}</SuccessShell>;
}
