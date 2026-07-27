import { TaraChat } from "@/features/tara/components/tara-chat";
import { bdmSuggestions } from "@/server/ai/prompts";
import { getTaraConversations } from "@/server/ai/conversations";
import { requireBdmUser } from "@/server/admissions/queries";

export const dynamic = "force-dynamic";

export default async function BdmTaraPage() {
  const user = await requireBdmUser();
  const conversations = await getTaraConversations(user.id, "BDM");

  return (
    <TaraChat
      scope="BDM"
      title="Tara BDM Assistant"
      subtitle="Tara uses your assigned leads, referrals, commissions, payments, and follow-up context to help you convert with clarity."
      suggestions={bdmSuggestions}
      conversations={conversations}
      templateKey="bdm_assistant"
    />
  );
}
