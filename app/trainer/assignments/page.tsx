import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { SubmissionReviewForm, TrainerTaskForm } from "@/features/trainer/components/trainer-forms";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

function taskStatus(task: { dueAt: Date | null; submissions: Array<{ status: string }>; progress: Array<{ status: string }> }) {
  const completed = task.progress.some((item) => item.status === "COMPLETED") || task.submissions.some((item) => item.status === "APPROVED");
  if (completed) return "COMPLETED";
  if (task.submissions.some((item) => item.status === "SUBMITTED")) return "SUBMITTED";
  if (task.dueAt && task.dueAt < new Date()) return "OVERDUE";
  return "PENDING";
}

function formatDate(date?: Date | null) {
  if (!date) return "No due date";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function TrainerAssignmentsPage() {
  const trainer = await requireTrainer();
  const { batches, tasks, submissions } = await getTrainerWorkspaceData(trainer.id);
  const batchOptions = batches.map((batch) => ({ id: batch.id, name: `${batch.name} - ${batch.program.name}` }));
  const dayOptions = batches.flatMap((batch) =>
    batch.journey?.phases.flatMap((phase) =>
      phase.weeks.flatMap((week) =>
        week.days.map((day) => ({
          id: day.id,
          batchId: batch.id,
          name: `${batch.name} - Month ${phase.order}, Week ${week.weekNumber}, Day ${day.dayNumber}: ${day.title}`
        }))
      )
    ) ?? []
  );
  const statuses = tasks.map(taskStatus);
  const pendingSubmissions = submissions.filter((submission) => submission.status === "SUBMITTED");

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Tasks" title="Trainer task operating screen" description="Create batch tasks, track due work, and review student submissions." />
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Batch Tasks" value={tasks.length} icon={FileText} />
        <DirectorMetricCard label="Pending" value={statuses.filter((status) => status === "PENDING").length} icon={Clock} />
        <DirectorMetricCard label="Overdue" value={statuses.filter((status) => status === "OVERDUE").length} icon={AlertTriangle} />
        <DirectorMetricCard label="Completed" value={statuses.filter((status) => status === "COMPLETED").length} icon={CheckCircle2} />
      </section>

      <Card>
        <CardContent className="p-6">
          <TrainerTaskForm batches={batchOptions} days={dayOptions} />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-black uppercase text-brand-red">Assigned Tasks</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Batch task board</h2>
            <div className="mt-5 space-y-4">
              {tasks.map((task) => {
                const status = taskStatus(task);
                return (
                  <div key={task.id} className="rounded-lg bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-brand-red">{status}</p>
                        <h3 className="mt-1 text-xl font-black text-brand-dark">{task.title}</h3>
                        <p className="mt-1 text-sm font-bold text-brand-muted">{task.batch?.name ?? "Batch"} - {task.day.title}</p>
                      </div>
                      <p className="text-sm font-bold text-brand-muted">{formatDate(task.dueAt)}</p>
                    </div>
                    <p className="mt-3 leading-7 text-brand-muted">{task.description}</p>
                    {task.resourceUrl ? <a href={task.resourceUrl} className="mt-3 block break-all font-bold text-brand-red" target="_blank" rel="noreferrer">Open resource</a> : null}
                  </div>
                );
              })}
              {tasks.length === 0 ? <p className="font-semibold text-brand-muted">No batch tasks assigned yet.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-black uppercase text-brand-red">Review Queue</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">Submitted work</h2>
            <div className="mt-5 space-y-4">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="rounded-lg bg-white p-4">
                  <p className="text-sm font-black text-brand-red">{submission.status} - {submission.type}</p>
                  <h3 className="mt-1 text-xl font-black text-brand-dark">{submission.title}</h3>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{submission.student.name} - {submission.activity?.title ?? submission.day.title}</p>
                  {submission.url ? <a href={submission.url} className="mt-3 block break-all font-bold text-brand-red" target="_blank" rel="noreferrer">Open submission</a> : null}
                  {submission.content ? <p className="mt-3 leading-7 text-brand-muted">{submission.content}</p> : null}
                  <SubmissionReviewForm submissionId={submission.id} />
                </div>
              ))}
              {pendingSubmissions.length === 0 ? <p className="font-semibold text-brand-muted">No submissions waiting for review.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
