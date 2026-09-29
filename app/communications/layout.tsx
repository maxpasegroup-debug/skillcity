import { redirect } from "next/navigation";
import { CommunicationsShell } from "@/components/layout/communications-shell";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function CommunicationsLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentUser();
  if (!actor) redirect("/login");
  const access = {
    channels: hasPermission(actor, PERMISSIONS.INTERNAL_COMMUNICATIONS_READ),
    operations: hasPermission(actor, PERMISSIONS.COMMUNICATIONS_READ),
    templates: hasPermission(actor, PERMISSIONS.COMMUNICATION_TEMPLATES_MANAGE) || hasPermission(actor, PERMISSIONS.COMMUNICATIONS_READ),
    automations: hasPermission(actor, PERMISSIONS.AUTOMATIONS_READ) || hasPermission(actor, PERMISSIONS.COMMUNICATIONS_READ)
  };
  if (!Object.values(access).some(Boolean)) redirect("/workspace");
  return <CommunicationsShell access={access}>{children}</CommunicationsShell>;
}
