import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function TrainerCalendarPage() {
  const trainer = await requireTrainer();
  const { calendarEvents } = await getTrainerWorkspaceData(trainer.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Calendar" title="Trainer calendar" description="Live classes, offline classes, meetings, resources, homework and follow-up tasks appear here." /><div className="grid gap-5 lg:grid-cols-2">{calendarEvents.map((event) => <Card key={event.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{event.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{event.title}</h2><p className="mt-2 font-bold text-brand-muted">{event.startsAt.toLocaleString()} - {event.batch?.name ?? event.program?.name ?? "Skill City"}</p></CardContent></Card>)}</div></div>;
}
