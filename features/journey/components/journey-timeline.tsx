import Link from "next/link";
import { CheckCircle2, CircleDot, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { JourneyDayView, JourneyPhaseView } from "@/types/journey";

function getMonthLabel(day: JourneyDayView) {
  return `Month ${Math.ceil(day.absoluteDay / 30)}`;
}

function DayStateIcon({ state }: { state: JourneyDayView["state"] }) {
  if (state === "completed") {
    return <CheckCircle2 className="h-5 w-5 text-brand-red" />;
  }
  if (state === "locked") {
    return <Lock className="h-5 w-5 text-brand-muted" />;
  }
  return <CircleDot className="h-5 w-5 text-brand-red" />;
}

export function JourneyTimeline({ phases }: { phases: JourneyPhaseView[] }) {
  const days = phases.flatMap((phase) =>
    phase.weeks.flatMap((week) =>
      week.days.map((day) => ({
        phase,
        week,
        day
      }))
    )
  );
  const months = new Map<string, typeof days>();

  for (const item of days) {
    const label = getMonthLabel(item.day);
    months.set(label, [...(months.get(label) ?? []), item]);
  }

  return (
    <div className="space-y-8">
      {[...months.entries()].map(([month, monthDays]) => (
        <section key={month}>
          <h2 className="text-3xl font-black text-brand-dark">{month}</h2>
          <div className="mt-5 space-y-5">
            {Object.entries(
              monthDays.reduce<Record<string, typeof monthDays>>((groups, item) => {
                const key = `${item.phase.title} / Week ${item.week.weekNumber}`;
                groups[key] = [...(groups[key] ?? []), item];
                return groups;
              }, {})
            ).map(([weekTitle, weekDays]) => (
              <Card key={weekTitle}>
                <CardContent className="p-6">
                  <p className="text-sm font-black uppercase tracking-normal text-brand-red">{weekTitle}</p>
                  <h3 className="mt-2 text-2xl font-black text-brand-dark">{weekDays[0]?.week.title}</h3>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {weekDays.map(({ day }) => {
                      const locked = day.state === "locked";
                      const content = (
                        <div
                          className={cn(
                            "min-h-36 rounded-lg border p-5 transition",
                            day.state === "current" && "border-brand-red bg-brand-beige",
                            day.state === "completed" && "border-black/5 bg-white",
                            day.state === "upcoming" && "border-black/10 bg-white",
                            day.state === "locked" && "border-black/5 bg-brand-card opacity-70"
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-black text-brand-muted">Day {day.absoluteDay}</p>
                            <DayStateIcon state={day.state} />
                          </div>
                          <h4 className="mt-4 text-xl font-black text-brand-dark">{day.title}</h4>
                          <p className="mt-3 text-sm font-bold text-brand-muted">
                            {day.completedActivityCount} of {day.activityCount} complete
                          </p>
                        </div>
                      );

                      return locked ? (
                        <div key={day.id}>{content}</div>
                      ) : (
                        <Link key={day.id} href={`/my-journey/day/${day.id}`} className="block">
                          {content}
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
