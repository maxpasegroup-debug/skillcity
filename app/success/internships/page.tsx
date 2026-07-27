import { Card, CardContent } from "@/components/ui/card";
import { InternshipForm } from "@/features/success/components/success-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function InternshipsPage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Internship Hub" title="Internship record" description="Track companies, duration, mentor, feedback and completion." /><Card><CardContent className="p-6"><InternshipForm /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.internships.map((internship) => <Card key={internship.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{internship.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{internship.company}</h2><p className="mt-2 font-bold text-brand-muted">{internship.role} - {internship.mentor?.name ?? "Mentor pending"}</p><p className="mt-3 leading-7 text-brand-muted">{internship.feedback ?? "Feedback pending"}</p></CardContent></Card>)}</div></div>;
}
