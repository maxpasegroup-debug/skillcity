"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "./form-message";

const initialState = { ok: false, message: "" };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <Input name="email" label="Email" type="email" autoComplete="email" required />
      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? "Sending link..." : "Send reset link"}
      </Button>
    </form>
  );
}
