import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { ensureDefaultPipeline } from "@/server/admissions/queries";

export default async function AdmissionSettingsPage() {
  const stages = await ensureDefaultPipeline();
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Settings" title="Admission settings" description="Configurable pipeline stages and provider-neutral payment/communication architecture." /><div className="grid gap-4 md:grid-cols-2">{stages.map((stage) => <Card key={stage.id}><CardContent className="p-5"><p className="text-sm font-black text-brand-red">Stage {stage.order}</p><h3 className="mt-2 text-xl font-black text-brand-dark">{stage.name}</h3></CardContent></Card>)}</div></div>;
}
