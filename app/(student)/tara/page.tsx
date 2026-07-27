import { TaraChat } from "@/features/tara/components/tara-chat";
import { getTaraConversations } from "@/server/ai/conversations";
import { studentSuggestions } from "@/server/ai/prompts";
import { requireStudent } from "@/server/journey/queries";

export const dynamic = "force-dynamic";

export default async function TaraPage() {
  const user = await requireStudent();
  const conversations = await getTaraConversations(user.id, "STUDENT");
  return (
    <TaraChat
      scope="STUDENT"
      title="Ask Tara"
      subtitle="Tara understands your program, journey, current day, ALTT session, progress, reflections, submissions, and assessments."
      suggestions={studentSuggestions}
      conversations={conversations}
      templateKey="learning_coach"
    />
  );
}
