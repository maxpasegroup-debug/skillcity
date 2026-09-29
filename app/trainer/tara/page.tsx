import { TaraChat } from "@/features/tara/components/tara-chat";
import { getTaraConversations } from "@/server/ai/conversations";
import { trainerSuggestions } from "@/server/ai/prompts";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";

export const dynamic = "force-dynamic";

export default async function TrainerTaraPage() {
  const user = await requirePermission(PERMISSIONS.AI_TRAINER);

  const conversations = await getTaraConversations(user.id, "TRAINER");
  return (
    <TaraChat
      scope="TRAINER"
      title="SIA Trainer Assistant"
      subtitle="Summarize reflections, review submissions, generate feedback, create quizzes, identify struggling students, and prepare the next class."
      suggestions={trainerSuggestions}
      conversations={conversations}
      templateKey="trainer_assistant"
    />
  );
}
