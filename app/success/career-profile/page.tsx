import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function CareerProfilePage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Career Profile" title="Career readiness profile" description="A simple summary of verified proof for placement and mentoring conversations." /><section className="grid gap-5 lg:grid-cols-3"><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Readiness Score</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{data.placement?.readinessScore ?? 0}%</h2></CardContent></Card><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Approved Projects</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{data.projects.filter((item) => item.status === "APPROVED").length}</h2></CardContent></Card><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Milestones</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{data.milestones.length}</h2></CardContent></Card></section><div className="grid gap-5 lg:grid-cols-2">{data.milestones.map((milestone) => <Card key={milestone.id}><CardContent className="p-6"><h2 className="text-2xl font-black text-brand-dark">{milestone.title}</h2><p className="mt-2 font-bold text-brand-muted">{milestone.achievedAt.toDateString()}</p><p className="mt-3 leading-7 text-brand-muted">{milestone.description ?? "Milestone recorded."}</p></CardContent></Card>)}</div></div>;
}
