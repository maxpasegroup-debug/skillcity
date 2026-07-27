import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarEventForm } from "@/features/director/components/director-forms";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorCalendarData } from "@/server/director/queries";

export default async function DirectorCalendarPage() {
  const [events, programs, batches, journeys] = await getDirectorCalendarData();
  const today = new Date().toDateString();

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Calendar" title="Planning calendar" description="See today, this week, this month, live sessions, offline workshops, holidays, and rescheduled events." />
      <Card><CardContent className="p-6 md:p-8"><CalendarEventForm programs={programs} batches={batches} journeys={journeys.map((journey) => ({ id: journey.id, name: `${journey.program.name} v${journey.version}` }))} /></CardContent></Card>
      <section className="grid gap-6 lg:grid-cols-3">
        <CalendarColumn title="Today's Plan" events={events.filter((event) => event.startsAt.toDateString() === today)} />
        <CalendarColumn title="Upcoming Live Sessions" events={events.filter((event) => event.type === "LIVE_CLASS")} />
        <CalendarColumn title="Offline Workshops" events={events.filter((event) => event.type === "OFFLINE_WORKSHOP")} />
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Month Plan</h2>
        {events.length === 0 ? <DirectorEmptyState icon={CalendarDays} message="No calendar events are scheduled for the next 30 days." /> : (
          <div className="space-y-4">{events.map((event) => <EventCard key={event.id} event={event} />)}</div>
        )}
      </section>
    </div>
  );
}

function CalendarColumn({ title, events }: { title: string; events: Awaited<ReturnType<typeof getDirectorCalendarData>>[0] }) {
  return (
    <Card><CardContent className="p-6"><h2 className="text-xl font-black text-brand-dark">{title}</h2><div className="mt-4 space-y-3">{events.length === 0 ? <p className="text-sm font-semibold text-brand-muted">Nothing scheduled.</p> : events.slice(0, 4).map((event) => <EventCard key={event.id} event={event} compact />)}</div></CardContent></Card>
  );
}

function EventCard({ event, compact }: { event: Awaited<ReturnType<typeof getDirectorCalendarData>>[0][number]; compact?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-4">
      <p className="text-sm font-black text-brand-red">{event.type.replaceAll("_", " ")} · {event.status}</p>
      <h3 className={`${compact ? "text-lg" : "text-2xl"} mt-2 font-black text-brand-dark`}>{event.title}</h3>
      <p className="mt-2 text-sm font-bold text-brand-muted">{event.startsAt.toLocaleString()} {event.batch ? `· ${event.batch.name}` : ""}</p>
    </div>
  );
}
