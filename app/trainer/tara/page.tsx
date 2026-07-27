import { redirect } from "next/navigation";
import { TaraChat } from "@/features/tara/components/tara-chat";
import { getTaraConversations } from "@/server/ai/conversations";
import { trainerSuggestions } from "@/server/ai/prompts";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function TrainerTaraPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const roles = user.roles.map((item) => item.role.name);
  if (!roles.some((role) => ["Trainer", "Director", "Admin"].includes(role))) redirect("/dashboard");

  const conversations = await getTaraConversations(user.id, "TRAINER");
  return (
    <TaraChat
      scope="TRAINER"
      title="Tara Trainer Assistant"
      subtitle="Summarize reflections, review submissions, generate feedback, create quizzes, identify struggling students, and prepare the next class."
      suggestions={trainerSuggestions}
      conversations={conversations}
      templateKey="trainer_assistant"
    />
  );
}
