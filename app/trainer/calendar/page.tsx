import { Card, CardContent } from "@/components/ui/card";
import { TrainerClassScheduleForm } from "@/features/trainer/components/trainer-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getTrainerWorkspaceData, requireTrainer } from "@/server/trainer/queries";

export default async function TrainerCalendarPage() {
  const trainer = await requireTrainer();
  const { batches, calendarEvents } = await getTrainerWorkspaceData(trainer.id);
  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Calendar" title="Trainer calendar" description="Schedule online, offline, or hybrid classes for your assigned batches." />
      <Card>
        <CardContent className="p-6">
          <TrainerClassScheduleForm batches={batches.map((batch) => ({ id: batch.id, name: `${batch.name} - ${batch.program.name}` }))} />
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        {calendarEvents.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6">
              <p className="text-sm font-black text-brand-red">{event.type.replaceAll("_", " ")}</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">{event.title}</h2>
              <p className="mt-2 font-bold text-brand-muted">{event.startsAt.toLocaleString()} - {event.batch?.name ?? event.program?.name ?? "Skill City"}</p>
              {event.location ? <p className="mt-3 break-all font-bold text-brand-dark">{event.location}</p> : null}
            </CardContent>
          </Card>
        ))}
        {calendarEvents.length === 0 ? <p className="font-semibold text-brand-muted">No classes scheduled yet.</p> : null}
      </div>
    </div>
  );
}
