import { TaraChat } from "@/features/tara/components/tara-chat";
import { directorSuggestions } from "@/server/ai/prompts";
import { getTaraConversations } from "@/server/ai/conversations";
import { requireExecutive } from "@/server/executive/queries";

export const dynamic = "force-dynamic";

export default async function AICommandCenterPage() {
  const user = await requireExecutive();
  const conversations = await getTaraConversations(user.id, "DIRECTOR");
  return <TaraChat scope="DIRECTOR" title="Tara Executive Assistant" subtitle="Ask Tara about batch performance, at-risk students, trainer support, reports, admissions forecasts, community engagement, revenue trends and inactive students." suggestions={directorSuggestions} conversations={conversations} templateKey="director_planner" />;
}
