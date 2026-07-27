"use client";

import { useOptimistic, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeLearningStepAction } from "@/actions/altt";

export function StepCompleteButton({ stepId, dayId, completed }: { stepId: string; dayId: string; completed: boolean }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(completed);

  return (
    <Button
      type="button"
      variant={done ? "secondary" : "primary"}
      disabled={done || pending}
      onClick={() => {
        setDone(true);
        startTransition(async () => completeLearningStepAction(stepId, dayId));
      }}
    >
      <CheckCircle2 className="h-5 w-5" />
      {done ? "Step Complete" : pending ? "Saving..." : "Complete Step"}
    </Button>
  );
}
