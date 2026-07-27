"use client";

import { useTransition } from "react";
import { joinChallengeAction, registerEventAction } from "@/actions/community";
import { Button } from "@/components/ui/button";

export function RegisterEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button disabled={pending} onClick={() => startTransition(() => registerEventAction(eventId))}>{pending ? "Registering..." : "Register"}</Button>;
}

export function JoinChallengeButton({ challengeId }: { challengeId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button disabled={pending} onClick={() => startTransition(() => joinChallengeAction(challengeId))}>{pending ? "Joining..." : "Join Challenge"}</Button>;
}
