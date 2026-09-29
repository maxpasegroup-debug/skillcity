import { TaraChat } from "@/features/tara/components/tara-chat";
import { directorSuggestions } from "@/server/ai/prompts";
import { getTaraConversations } from "@/server/ai/conversations";
import { requireExecutive } from "@/server/executive/queries";

export const dynamic = "force-dynamic";

export default async function AICommandCenterPage() {
  const user = await requireExecutive();
  const conversations = await getTaraConversations(user.id, "DIRECTOR");
  return <TaraChat scope="DIRECTOR" title="SIA Executive Assistant" subtitle="SIA uses the governed AIRA AI Core for planning and factual summaries from authorized context. Verify decisions against the authoritative dashboard and source records." suggestions={directorSuggestions} conversations={conversations} templateKey="director_planner" />;
}
