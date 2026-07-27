import { BarChart3, BookOpen, ClipboardCheck, FileText, TrendingUp, Users } from "lucide-react";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerDashboard, getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function TrainerReportsPage() {
  const trainer = await requireTrainer();
  const [dashboard, data] = await Promise.all([getTrainerDashboard(trainer.id), getTrainerWorkspaceData(trainer.id)]);
  const approved = data.submissions.filter((item) => item.status === "APPROVED").length;
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Reports" title="Trainer analytics" description="Simple batch progress, attendance, assignment, performance and assessment statistics." /><section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><DirectorMetricCard label="Batch Progress" value={data.batches.length} icon={TrendingUp} /><DirectorMetricCard label="Average Attendance" value={`${dashboard.stats.attendanceToday}%`} icon={ClipboardCheck} /><DirectorMetricCard label="Assignment Completion" value={data.submissions.length === 0 ? "0%" : `${Math.round((approved / data.submissions.length) * 100)}%`} icon={FileText} /><DirectorMetricCard label="Student Performance" value={`${dashboard.stats.studentEngagement}%`} icon={Users} /><DirectorMetricCard label="Pending Reviews" value={dashboard.stats.pendingReviews} icon={BarChart3} /><DirectorMetricCard label="Assessment Statistics" value={data.assessments.length} icon={BookOpen} /></section></div>;
}
