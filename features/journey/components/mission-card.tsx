import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { JourneyDayView } from "@/types/journey";

export function MissionCard({ day }: { day: JourneyDayView }) {
  const progress = day.activityCount === 0 ? 0 : Math.round((day.completedActivityCount / day.activityCount) * 100);

  return (
    <Card className="bg-brand-red text-white">
      <CardContent className="p-8 md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-white/80">Today&apos;s Mission</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{day.title}</h2>
            {day.summary ? <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">{day.summary}</p> : null}
            <div className="mt-6 flex items-center gap-3 text-base font-bold text-white">
              <CheckCircle2 className="h-5 w-5" />
              {day.completedActivityCount} of {day.activityCount} activities complete
            </div>
          </div>
          <div className="w-full shrink-0 md:w-64">
            <div className="h-3 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
            <Button asChild variant="secondary" size="lg" className="mt-6 w-full">
              <Link href={`/my-journey/day/${day.id}`}>
                Continue Journey
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
