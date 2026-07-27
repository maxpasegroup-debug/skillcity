"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormMessage } from "./form-message";

const initialState = { ok: false, message: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <Input name="email" label="Email" type="email" autoComplete="email" required />
      <PasswordInput name="password" label="Password" autoComplete="current-password" required />
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-bold text-brand-red">
          Forgot password?
        </Link>
      </div>
      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? "Logging in..." : "Login"}
      </Button>
      <p className="text-center text-sm text-brand-muted">
        New to SkillCity?{" "}
        <Link href="/register" className="font-bold text-brand-red">
          Create account
        </Link>
      </p>
    </form>
  );
}
