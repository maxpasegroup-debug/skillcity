import { Card, CardContent } from "@/components/ui/card";
import type { AlttProgressView } from "@/types/altt";

export function LearningProgressCard({ progress }: { progress: AlttProgressView }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-normal text-brand-red">Learning Progress</p>
            <h2 className="mt-2 text-2xl font-black text-brand-dark">{progress.currentStep ? `Current Step: ${progress.currentStep.title}` : "All steps complete"}</h2>
          </div>
          <div className="w-full md:w-80">
            <div className="flex justify-between text-sm font-bold text-brand-muted"><span>{progress.completedSteps} of {progress.totalSteps} steps</span><span>{progress.completionPercent}%</span></div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-brand-red" style={{ width: `${progress.completionPercent}%` }} /></div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 text-sm font-bold text-brand-muted sm:grid-cols-3">
          <p>Reflection: <span className="text-brand-dark">{progress.reflectionStatus}</span></p>
          <p>Submission: <span className="text-brand-dark">{progress.submissionStatus}</span></p>
          <p>Assessment: <span className="text-brand-dark">{progress.assessmentStatus}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}
