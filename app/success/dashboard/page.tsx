import { Award, BadgeCheck, Briefcase, FileText, FolderGit2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function SuccessDashboardPage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Student Success" title="Proof of skills" description="Your portfolio, projects, skills, certificates, resume and career readiness in one place." /><section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><DirectorMetricCard label="Portfolio Status" value={data.portfolio.approvalStatus} icon={FileText} /><DirectorMetricCard label="Projects" value={data.projects.length} icon={FolderGit2} /><DirectorMetricCard label="Verified Skills" value={data.skills.length} icon={Sparkles} /><DirectorMetricCard label="Certificates" value={data.certificates.length} icon={BadgeCheck} /><DirectorMetricCard label="Achievements" value={data.achievements.length} icon={Award} /><DirectorMetricCard label="Readiness" value={`${data.placement?.readinessScore ?? 0}%`} icon={Briefcase} /></section><Card><CardContent className="p-6"><h2 className="text-2xl font-black text-brand-dark">Tara can help</h2><p className="mt-3 leading-7 text-brand-muted">Ask Tara to review your portfolio, improve your resume, generate a project description, improve a GitHub README, prepare interview questions, or suggest missing skills.</p></CardContent></Card></div>;
}
