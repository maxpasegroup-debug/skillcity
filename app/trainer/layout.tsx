import { TrainerShell } from "@/components/layout/trainer-shell";
import { requireTrainer } from "@/server/trainer/queries";

export const dynamic = "force-dynamic";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  await requireTrainer();
  return <TrainerShell>{children}</TrainerShell>;
}
