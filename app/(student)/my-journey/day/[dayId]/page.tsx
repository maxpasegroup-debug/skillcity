import { notFound } from "next/navigation";
import { ActivityCard } from "@/features/journey/components/activity-card";
import { EmptyJourneyState } from "@/features/journey/components/empty-journey-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentDay, requireStudent } from "@/server/journey/queries";
import Link from "next/link";

export default async function JourneyDayPage({ params }: { params: Promise<{ dayId: string }> }) {
  const user = await requireStudent();
  const { dayId } = await params;
  const journey = await getStudentDay(user.id, dayId);

  if (!journey) {
    return <EmptyJourneyState />;
  }

  const { selectedDay } = journey;

  if (selectedDay.state === "locked") {
    notFound();
  }

  const required = selectedDay.activities.filter((activity) => activity.required);
  const completedRequired = required.filter((activity) => activity.progressStatus === "COMPLETED");
  const percent = required.length === 0 ? 0 : Math.round((completedRequired.length / required.length) * 100);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-lg font-bold text-brand-red">Day {selectedDay.absoluteDay}</p>
        <h1 className="mt-3 text-4xl font-black text-brand-dark md:text-5xl">{selectedDay.title}</h1>
        {selectedDay.summary ? <p className="mt-5 max-w-3xl text-lg leading-8 text-brand-muted">{selectedDay.summary}</p> : null}
      </section>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-brand-red">Today&apos;s Goal</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">Complete the activities in order.</h2>
            </div>
            <div className="w-full md:w-80">
              <div className="flex justify-between text-sm font-bold text-brand-muted">
                <span>Day progress</span>
                <span>{percent}%</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-brand-red" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>
          <Button asChild size="lg" className="mt-6">
            <Link href={`/learn/day/${selectedDay.id}`}>Start Guided ALTT Session</Link>
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-4">
        {selectedDay.activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </section>
    </div>
  );
}
