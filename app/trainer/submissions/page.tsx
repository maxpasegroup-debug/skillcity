import { Card, CardContent } from "@/components/ui/card";
import { SubmissionReviewForm } from "@/features/trainer/components/trainer-forms";
import { ReviewAiPanel } from "@/features/trainer/components/review-ai-panel";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function SubmissionsPage() {
  const trainer = await requireTrainer();
  const { submissions } = await getTrainerWorkspaceData(trainer.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Submissions" title="Assignment review queue" description="Review text, files, GitHub repositories, URLs, images and video links." /><ReviewAiPanel focus="submissions" /><div className="grid gap-5 lg:grid-cols-2">{submissions.map((submission) => <Card key={submission.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{submission.status} - {submission.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{submission.title}</h2><p className="mt-2 font-bold text-brand-muted">{submission.student.name} - {submission.day.title}</p>{submission.url ? <a href={submission.url} className="mt-3 block break-all font-bold text-brand-red">{submission.url}</a> : null}<p className="mt-3 leading-7 text-brand-muted">{submission.content ?? "Submission content is stored in metadata or attachment links."}</p>{submission.status === "SUBMITTED" ? <SubmissionReviewForm submissionId={submission.id} /> : null}</CardContent></Card>)}</div></div>;
}
