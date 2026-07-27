import { EmptyJourneyState } from "@/features/journey/components/empty-journey-state";
import { JourneyTimeline } from "@/features/journey/components/journey-timeline";
import { getStudentJourney, requireStudent } from "@/server/journey/queries";

export default async function MyJourneyPage() {
  const user = await requireStudent();
  const journey = await getStudentJourney(user.id);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-lg font-bold text-brand-red">My Journey</p>
        <h1 className="mt-3 text-4xl font-black text-brand-dark md:text-5xl">Your transformation timeline</h1>
      </section>
      {journey ? <JourneyTimeline phases={journey.phases} /> : <EmptyJourneyState />}
    </div>
  );
}
