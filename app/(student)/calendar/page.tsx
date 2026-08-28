import { CalendarDays, MapPin, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudentEmptyPage } from "@/features/journey/components/student-empty-page";
import { getStudentCalendar, requireStudent } from "@/server/journey/queries";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function isUrl(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export default async function CalendarPage() {
  const user = await requireStudent();
  const { enrollment, events } = await getStudentCalendar(user.id);

  if (!enrollment?.batchId) {
    return (
      <StudentEmptyPage
        eyebrow="Calendar"
        title="Batch assignment pending"
        message="Your learning calendar will appear here after the admissions team assigns your batch."
        icon={CalendarDays}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-lg font-bold text-brand-red">Calendar</p>
        <h1 className="mt-3 text-4xl font-black text-brand-dark md:text-5xl">Your classes</h1>
        <p className="mt-3 max-w-3xl font-semibold text-brand-muted">{enrollment.program.name} - {enrollment.batch?.name}</p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6">
              <p className="text-sm font-black text-brand-red">{event.type.replaceAll("_", " ")}</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">{event.title}</h2>
              <p className="mt-2 font-bold text-brand-muted">{formatDate(event.startsAt)}</p>
              {event.batch?.trainerAssignments.length ? (
                <p className="mt-2 font-bold text-brand-muted">Trainer: <span className="text-brand-dark">{event.batch.trainerAssignments.map((item) => item.trainer.name).join(", ")}</span></p>
              ) : null}
              {event.description ? <p className="mt-3 leading-7 text-brand-muted">{event.description}</p> : null}
              {event.location ? (
                isUrl(event.location) ? (
                  <Button asChild className="mt-5"><a href={event.location} target="_blank" rel="noreferrer"><Radio className="h-5 w-5" />Join Class</a></Button>
                ) : (
                  <p className="mt-5 flex items-center gap-2 font-bold text-brand-dark"><MapPin className="h-5 w-5 text-brand-red" />{event.location}</p>
                )
              ) : null}
            </CardContent>
          </Card>
        ))}
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-6 font-bold text-brand-muted">No classes are scheduled for your batch yet.</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
