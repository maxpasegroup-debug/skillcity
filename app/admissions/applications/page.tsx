import { Card, CardContent } from "@/components/ui/card";
import { ApplicationForm } from "@/features/admissions/components/admission-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionData, getAdmissionsOperationalLists } from "@/server/admissions/queries";

export default async function ApplicationsPage() {
  const [{ leads, programs }, [applications]] = await Promise.all([getAdmissionData(), getAdmissionsOperationalLists()]);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Applications" title="Admission applications" /><Card><CardContent className="p-6"><ApplicationForm leads={leads} programs={programs} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{applications.map((app) => <Card key={app.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{app.status}</p><h3 className="mt-2 text-2xl font-black text-brand-dark">{app.lead.name}</h3><p className="mt-2 font-bold text-brand-muted">{app.program.name} · {app.documents.length} documents</p></CardContent></Card>)}</div></div>;
}
