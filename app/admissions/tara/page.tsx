import { TaraChat } from "@/features/tara/components/tara-chat";
import { admissionSuggestions } from "@/server/ai/prompts";
import { getTaraConversations } from "@/server/ai/conversations";
import { requireAdmissionUser } from "@/server/admissions/queries";

export const dynamic = "force-dynamic";

export default async function AdmissionTaraPage() {
  const user = await requireAdmissionUser();
  const conversations = await getTaraConversations(user.id, "ADMISSION");

  return (
    <TaraChat
      scope="ADMISSION"
      title="Tara Admission Assistant"
      subtitle="Tara uses CRM, counselling, documents, payments, and enrollment context to help the admissions team move students forward."
      suggestions={admissionSuggestions}
      conversations={conversations}
      templateKey="admission_assistant"
    />
  );
}
