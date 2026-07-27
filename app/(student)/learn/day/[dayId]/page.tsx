import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReflectionForm } from "@/features/altt/components/altt-forms";
import { LearningProgressCard } from "@/features/altt/components/learning-progress-card";
import { LearningStepCard } from "@/features/altt/components/learning-step-card";
import { requireLearningSession } from "@/server/altt/queries";
import { requireStudent } from "@/server/journey/queries";

export default async function LearningDayPage({ params }: { params: Promise<{ dayId: string }> }) {
  const user = await requireStudent();
  const { dayId } = await params;
  const { day, steps, progress } = await requireLearningSession(dayId);

  return (
    <div className="space-y-8">
      <Button asChild variant="secondary"><Link href={`/my-journey/day/${dayId}`}><ArrowLeft className="h-5 w-5" />Back to Day</Link></Button>
      <section>
        <p className="text-lg font-bold text-brand-red">Welcome, {user.name}</p>
        <h1 className="mt-3 text-4xl font-black text-brand-dark md:text-5xl">{day.title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-brand-muted">{day.summary ?? "Move through today&apos;s guided ALTT learning experience one step at a time."}</p>
      </section>

      <Card className="bg-brand-red text-white">
        <CardContent className="p-8">
          <p className="text-sm font-black uppercase tracking-normal text-white/80">Today&apos;s Goal</p>
          <h2 className="mt-3 text-3xl font-black">Understand, learn, practice, build, reflect, improve, and master today&apos;s outcome.</h2>
        </CardContent>
      </Card>

      {steps.length === 0 ? (
        <Card><CardContent className="p-8"><h2 className="text-2xl font-black text-brand-dark">ALTT flow not attached yet</h2><p className="mt-3 text-lg leading-8 text-brand-muted">A Director can attach a reusable learning flow to this day from the ALTT Learning Flows page.</p></CardContent></Card>
      ) : (
        <>
          <LearningProgressCard progress={progress} />
          <section className="space-y-4">{steps.map((step) => <LearningStepCard key={step.id} step={step} dayId={dayId} />)}</section>
          <Card><CardContent className="p-6 md:p-8"><h2 className="text-2xl font-black text-brand-dark">Reflection</h2><p className="mt-2 text-base leading-7 text-brand-muted">Store your learning signals for future Tara AI analysis.</p><div className="mt-6"><ReflectionForm dayId={dayId} questions={day.reflections} /></div></CardContent></Card>
          <Card><CardContent className="p-6 md:p-8"><h2 className="text-2xl font-black text-brand-dark">Completion</h2><p className="mt-2 text-base font-bold text-brand-muted">{progress.completionPercent === 100 ? "Today&apos;s guided learning session is complete." : "Complete the remaining required steps to finish today&apos;s session."}</p></CardContent></Card>
        </>
      )}
    </div>
  );
}
