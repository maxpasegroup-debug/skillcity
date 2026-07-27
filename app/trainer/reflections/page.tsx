import { Card, CardContent } from "@/components/ui/card";
import { ReflectionReviewForm } from "@/features/trainer/components/trainer-forms";
import { ReviewAiPanel } from "@/features/trainer/components/review-ai-panel";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function ReflectionsPage() {
  const trainer = await requireTrainer();
  const { reflections } = await getTrainerWorkspaceData(trainer.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Reflections" title="Student reflections" description="Read, comment, flag concerns, recommend Tara follow-up and mark reflection reviews complete." /><ReviewAiPanel focus="reflections" /><div className="grid gap-5 lg:grid-cols-2">{reflections.map((reflection) => <Card key={reflection.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{reflection.student.name}</p><h2 className="mt-2 text-xl font-black text-brand-dark">{reflection.reflection.question}</h2><p className="mt-3 leading-7 text-brand-muted">{reflection.answer}</p>{reflection.trainerFeedback.length === 0 ? <ReflectionReviewForm reflectionId={reflection.id} /> : <p className="mt-4 font-bold text-brand-muted">Reviewed</p>}</CardContent></Card>)}</div></div>;
}
