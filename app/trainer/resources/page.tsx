import { Card, CardContent } from "@/components/ui/card";
import { ResourceForm } from "@/features/trainer/components/trainer-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function ResourcesPage() {
  const trainer = await requireTrainer();
  const { batches, resources } = await getTrainerWorkspaceData(trainer.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Resources" title="Trainer resource library" description="Reusable videos, PDFs, code samples, templates, reference links and voice notes." /><Card><CardContent className="p-6"><ResourceForm batches={batches} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{resources.map((resource) => <Card key={resource.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{resource.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{resource.title}</h2><p className="mt-2 font-bold text-brand-muted">{resource.category?.name ?? "General"} - {resource.batch?.name ?? "All batches"}</p><a href={resource.url} className="mt-3 block break-all font-bold text-brand-red">{resource.url}</a></CardContent></Card>)}</div></div>;
}
