"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormMessage } from "./form-message";

const initialState = { ok: false, message: "" };

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <Input name="name" label="Full name" autoComplete="name" required />
      <Input name="email" label="Email" type="email" autoComplete="email" required />
      <PasswordInput name="password" label="Password" autoComplete="new-password" required />
      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-brand-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-brand-red">
          Login
        </Link>
      </p>
    </form>
  );
}
