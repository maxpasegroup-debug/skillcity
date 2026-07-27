import { Card, CardContent } from "@/components/ui/card";
import { PlacementApplicationForm, PlacementForm } from "@/features/success/components/success-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function PlacementPage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Placement Hub" title="Placement readiness" description="Track profile, interview history, applications, offers, company notes, mentor notes and readiness score." /><Card><CardContent className="p-6"><PlacementForm profile={data.placement} /></CardContent></Card><Card><CardContent className="p-6"><PlacementApplicationForm /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.placement?.applications.map((app) => <Card key={app.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{app.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{app.company}</h2><p className="mt-2 font-bold text-brand-muted">{app.role}{app.interviewAt ? ` - ${app.interviewAt.toLocaleString()}` : ""}</p><p className="mt-3 leading-7 text-brand-muted">{app.notes ?? "No notes yet."}</p></CardContent></Card>)}</div></div>;
}
