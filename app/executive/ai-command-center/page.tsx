import { TaraChat } from "@/features/tara/components/tara-chat";
import { directorSuggestions } from "@/server/ai/prompts";
import { getTaraConversations } from "@/server/ai/conversations";
import { requireExecutive } from "@/server/executive/queries";

export const dynamic = "force-dynamic";

export default async function AICommandCenterPage() {
  const user = await requireExecutive();
  const conversations = await getTaraConversations(user.id, "DIRECTOR");
  return <TaraChat scope="DIRECTOR" title="Tara Executive Assistant" subtitle="Use Tara for planning and factual summaries from authorized platform context. Verify operational decisions against the authoritative dashboard and source records." suggestions={directorSuggestions} conversations={conversations} templateKey="director_planner" />;
}
