import { redirect } from "next/navigation";
import { EmptyJourneyState } from "@/features/journey/components/empty-journey-state";
import { getStudentJourney, requireStudent } from "@/server/journey/queries";

export default async function TodaysTasksPage() {
  const user = await requireStudent();
  const journey = await getStudentJourney(user.id);

  if (!journey?.today) {
    return <EmptyJourneyState />;
  }

  redirect(`/my-journey/day/${journey.today.id}`);
}
