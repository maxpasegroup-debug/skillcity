"use client";

import { useOptimistic, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeActivityAction } from "@/actions/progress";

export function ActivityCompleteButton({ activityId, completed }: { activityId: string; completed: boolean }) {
  const [pending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(completed);

  return (
    <Button
      type="button"
      variant={optimisticCompleted ? "secondary" : "primary"}
      disabled={optimisticCompleted || pending}
      onClick={() => {
        setOptimisticCompleted(true);
        startTransition(async () => {
          await completeActivityAction(activityId);
        });
      }}
      className="w-full sm:w-fit"
    >
      <CheckCircle2 className="h-5 w-5" />
      {optimisticCompleted ? "Completed" : pending ? "Saving..." : "Mark Complete"}
    </Button>
  );
}
