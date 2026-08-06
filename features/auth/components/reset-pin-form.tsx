"use client";

import { useActionState } from "react";
import { resetPinAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { FormMessage } from "./form-message";

const initialState = { ok: false, message: "" };

export function ResetPinForm() {
  const [state, action, pending] = useActionState(resetPinAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <PasswordInput name="pin" label="New 6 digit PIN" inputMode="numeric" pattern="[0-9]{6}" autoComplete="new-password" required />
      <PasswordInput name="confirmPin" label="Confirm PIN" inputMode="numeric" pattern="[0-9]{6}" autoComplete="new-password" required />
      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? "Saving PIN..." : "Continue to dashboard"}
      </Button>
    </form>
  );
}
