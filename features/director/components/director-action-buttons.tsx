"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicateBlueprintAction, reorderActivityAction } from "@/actions/director";

export function DuplicateBlueprintButton({ blueprintId }: { blueprintId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button type="button" variant="secondary" disabled={pending} onClick={() => startTransition(async () => duplicateBlueprintAction(blueprintId))}>
      <Copy className="h-4 w-4" />
      Duplicate
    </Button>
  );
}

export function ReorderActivityButtons({ activityId }: { activityId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" className="h-10 w-10 px-0" disabled={pending} aria-label="Move activity up" onClick={() => startTransition(async () => reorderActivityAction(activityId, "up"))}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="secondary" className="h-10 w-10 px-0" disabled={pending} aria-label="Move activity down" onClick={() => startTransition(async () => reorderActivityAction(activityId, "down"))}>
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
