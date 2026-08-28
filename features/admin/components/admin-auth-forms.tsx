"use client";

import { useActionState } from "react";
import { adminLoginAction, changeAdminPinAction } from "@/actions/admin-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Input name="mobile" label="Mobile Number" inputMode="tel" autoComplete="tel" required />
      <Input name="pin" label="PIN" type="password" inputMode="numeric" autoComplete="current-password" required />
      <Button disabled={pending} className="w-full">
        {pending ? "Checking..." : "Login"}
      </Button>
    </form>
  );
}

export function AdminPinChangeForm() {
  const [state, action, pending] = useActionState(changeAdminPinAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Input name="currentPin" label="Current PIN" type="password" inputMode="numeric" required />
      <Input name="newPin" label="New PIN" type="password" inputMode="numeric" required />
      <Input name="confirmPin" label="Confirm New PIN" type="password" inputMode="numeric" required />
      <Button disabled={pending} className="w-full">
        {pending ? "Changing..." : "Change PIN"}
      </Button>
    </form>
  );
}
