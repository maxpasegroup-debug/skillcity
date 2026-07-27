import { Card, CardContent } from "@/components/ui/card";
import { ExecutiveReportForm } from "@/features/executive/components/executive-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveData } from "@/server/executive/queries";

export default async function ExecutiveReportsPage() {
  const [, , , , , reports] = await getExecutiveData();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Reports" title="Executive reports" description="Institution, program, department, finance, admissions, trainer, student, community, marketplace and AI usage reports with export architecture." /><Card><CardContent className="p-6"><ExecutiveReportForm /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{reports.map((report) => <Card key={report.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{report.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{report.title}</h2><p className="mt-3 leading-7 text-brand-muted">{report.summary}</p></CardContent></Card>)}</div></div>;
}
