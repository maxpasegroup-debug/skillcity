import type { TaraContext } from "@/types/tara";

export function summarizeContextTools(context: TaraContext) {
  return {
    hasActiveProgram: Boolean(context.program),
    hasCurrentDay: Boolean(context.currentDay),
    pendingActivityCount: context.pendingActivities.length,
    completedActivityCount: context.completedActivities.length,
    reflectionCount: context.reflections.length,
    submissionCount: context.submissions.length,
    assessmentCount: context.assessments.length
  };
}
