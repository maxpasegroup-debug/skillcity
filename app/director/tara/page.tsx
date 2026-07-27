import { TaraChat } from "@/features/tara/components/tara-chat";
import { getTaraConversations } from "@/server/ai/conversations";
import { directorSuggestions } from "@/server/ai/prompts";
import { requireDirector } from "@/server/director/queries";

export const dynamic = "force-dynamic";

export default async function DirectorTaraPage() {
  const user = await requireDirector();
  const conversations = await getTaraConversations(user.id, "DIRECTOR");
  return (
    <TaraChat
      scope="DIRECTOR"
      title="Tara Director Assistant"
      subtitle="Tara can use platform context to help plan journeys, ALTT improvements, announcements, schedules, quizzes, and struggling-student interventions."
      suggestions={directorSuggestions}
      conversations={conversations}
      templateKey="director_planner"
    />
  );
}
