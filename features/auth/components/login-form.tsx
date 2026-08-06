"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, whatsappPinLoginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormMessage } from "./form-message";

const initialState = { ok: false, message: "" };

export function LoginForm() {
  const [studentState, studentAction, studentPending] = useActionState(whatsappPinLoginAction, initialState);
  const [staffState, staffAction, staffPending] = useActionState(loginAction, initialState);

  return (
    <div className="space-y-6">
      <form action={studentAction} className="space-y-5">
        <FormMessage message={studentState.message} ok={studentState.ok} />
        <Input name="whatsapp" label="WhatsApp number" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" required />
        <PasswordInput name="pin" label="6 digit PIN" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required />
        <Button className="w-full" size="lg" disabled={studentPending}>
          {studentPending ? "Checking approval..." : "Login to dashboard"}
        </Button>
      </form>

      <p className="text-center text-sm text-brand-muted">
        New to AIRA Skill City?{" "}
        <Link href="/apply" className="font-bold text-brand-red">
          Apply first
        </Link>
      </p>
      <p className="text-center text-sm text-brand-muted">
        Already applied?{" "}
        <Link href="/application-status" className="font-bold text-brand-red">
          Check application status
        </Link>
      </p>

      <details className="rounded-lg border border-black/10 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-brand-dark">Staff login</summary>
        <form action={staffAction} className="mt-5 space-y-5">
          <FormMessage message={staffState.message} ok={staffState.ok} />
          <Input name="email" label="Email" type="email" autoComplete="email" required />
          <PasswordInput name="password" label="Password" autoComplete="current-password" required />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-bold text-brand-red">
              Forgot password?
            </Link>
          </div>
          <Button className="w-full" size="lg" disabled={staffPending}>
            {staffPending ? "Logging in..." : "Login as staff"}
          </Button>
        </form>
      </details>
    </div>
  );
}
