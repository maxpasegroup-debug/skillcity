import { Card, CardContent } from "@/components/ui/card";
import { AssessmentReviewForm } from "@/features/trainer/components/trainer-forms";
import { ReviewAiPanel } from "@/features/trainer/components/review-ai-panel";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function AssessmentsPage() {
  const trainer = await requireTrainer();
  const { assessments } = await getTrainerWorkspaceData(trainer.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Assessments" title="Assessment reviews" description="Review daily, weekly and final assessments with rubrics, score adjustments and remarks." /><ReviewAiPanel focus="assessments" /><div className="grid gap-5 lg:grid-cols-2">{assessments.map((assessment) => <Card key={assessment.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{assessment.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{assessment.student.name}</h2><p className="mt-2 font-bold text-brand-muted">{assessment.score}/{assessment.maxScore} - {assessment.day.title}</p><AssessmentReviewForm assessmentId={assessment.id} /></CardContent></Card>)}</div></div>;
}
