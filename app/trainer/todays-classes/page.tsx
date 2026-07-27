import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerDashboard, requireTrainer } from "@/server/trainer/queries";

export default async function TodaysClassesPage() {
  const trainer = await requireTrainer();
  const { classesToday } = await getTrainerDashboard(trainer.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Today's Classes" title="Class plan" description="Live, offline, meeting link, resources, homework and follow-up tasks stay visible here." /><div className="grid gap-5 lg:grid-cols-2">{classesToday.map((event) => <Card key={event.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{event.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{event.title}</h2><p className="mt-2 font-bold text-brand-muted">{event.startsAt.toLocaleString()} - {event.batch?.name ?? "Batch"}</p><p className="mt-3 leading-7 text-brand-muted">{event.description ?? "Class details will appear here when attached by the planning team."}</p></CardContent></Card>)}{classesToday.length === 0 ? <p className="font-semibold text-brand-muted">No classes scheduled today.</p> : null}</div></div>;
}
