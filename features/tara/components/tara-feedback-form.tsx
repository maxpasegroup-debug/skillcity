"use client";

import { useActionState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveTaraFeedbackAction } from "@/actions/tara";

const initialState = { ok: false, message: "" };

export function TaraFeedbackForm({ conversationId, messageId }: { conversationId: string; messageId: string }) {
  const [, action, pending] = useActionState(saveTaraFeedbackAction, initialState);
  return (
    <form action={action} className="mt-3 flex gap-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="messageId" value={messageId} />
      <Button name="rating" value="HELPFUL" variant="secondary" className="h-9 px-3 text-sm" disabled={pending} aria-label="Mark helpful">
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button name="rating" value="NOT_HELPFUL" variant="secondary" className="h-9 px-3 text-sm" disabled={pending} aria-label="Mark not helpful">
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </form>
  );
}
