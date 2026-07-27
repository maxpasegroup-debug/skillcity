import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getExecutiveData } from "@/server/executive/queries";

export default async function ExecutiveProgramsPage() {
  const [, , , , , , , , programs] = await getExecutiveData();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Programs" title="Program performance" description="Executive visibility into active programs, batches, enrollment and completion." /><div className="grid gap-5 lg:grid-cols-2">{programs.map((program) => <Card key={program.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{program.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{program.name}</h2><p className="mt-2 font-bold text-brand-muted">{program.enrollments.length} enrollments - {program.batches.length} batches</p></CardContent></Card>)}</div></div>;
}
