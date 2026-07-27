"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { FormMessage } from "./form-message";

const initialState = { ok: false, message: "" };

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);
  const token = searchParams.get("token") ?? "";

  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="token" value={token} />
      <PasswordInput name="password" label="New password" autoComplete="new-password" required />
      <Button className="w-full" size="lg" disabled={pending || !token}>
        {pending ? "Updating password..." : "Update password"}
      </Button>
      {state.ok ? (
        <p className="text-center text-sm text-brand-muted">
          <Link href="/login" className="font-bold text-brand-red">
            Go to login
          </Link>
        </p>
      ) : null}
    </form>
  );
}
