import { Workflow } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReorderActivityButtons } from "@/features/director/components/director-action-buttons";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { DayActivityForm } from "@/features/director/components/director-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorPlanner } from "@/server/director/queries";

export default async function DirectorJourneyPlannerPage() {
  const journeys = await getDirectorPlanner();

  return (
    <div className="space-y-10">
      <DirectorPageHeader
        eyebrow="Journey Planner"
        title="Plan every day of transformation"
        description="Click into any configured journey day, add activities, and reorder the learning flow students will see."
      />

      {journeys.length === 0 ? <DirectorEmptyState icon={Workflow} message="No journeys are available yet. Create a program first, then return here to plan its days." /> : (
        <div className="space-y-8">
          {journeys.map((journey) => (
            <Card key={journey.id}>
              <CardContent className="p-6 md:p-8">
                <p className="text-sm font-black text-brand-red">{journey.program.name} · Version {journey.version}</p>
                <h2 className="mt-2 text-3xl font-black text-brand-dark">{journey.name}</h2>
                <div className="mt-6 space-y-6">
                  {journey.phases.length === 0 ? (
                    <p className="text-base font-semibold text-brand-muted">This journey does not have phases yet.</p>
                  ) : journey.phases.map((phase) => (
                    <div key={phase.id} className="rounded-lg bg-white p-5">
                      <h3 className="text-2xl font-black text-brand-dark">{phase.title}</h3>
                      <div className="mt-5 space-y-5">
                        {phase.weeks.map((week) => (
                          <div key={week.id}>
                            <p className="text-sm font-black uppercase tracking-normal text-brand-red">Week {week.weekNumber} · {week.title}</p>
                            <div className="mt-4 grid gap-5 lg:grid-cols-2">
                              {week.days.map((day) => (
                                <Card key={day.id}>
                                  <CardContent className="p-5">
                                    <h4 className="text-xl font-black text-brand-dark">Day {day.dayNumber}: {day.title}</h4>
                                    {day.summary ? <p className="mt-2 text-sm leading-6 text-brand-muted">{day.summary}</p> : null}
                                    <div className="mt-5 space-y-3">
                                      {day.activities.length === 0 ? <p className="text-sm font-semibold text-brand-muted">No activities added yet.</p> : day.activities.map((activity) => (
                                        <div key={activity.id} className="flex items-center justify-between gap-3 rounded-lg border border-black/5 bg-white px-4 py-3">
                                          <div>
                                            <p className="font-black text-brand-dark">{activity.sortOrder}. {activity.title}</p>
                                            <p className="text-sm font-bold text-brand-muted">{activity.type.replaceAll("_", " ")} · {activity.required ? "Required" : "Optional"}</p>
                                          </div>
                                          <ReorderActivityButtons activityId={activity.id} />
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-6 rounded-lg bg-brand-card p-5">
                                      <DayActivityForm dayId={day.id} />
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
