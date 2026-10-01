"use client";

import Link from "next/link";
import { useActionState } from "react";
import { labsSignupAction, mobilePinLoginAction, requestMobilePinResetAction, resetMobilePinWithOtpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormMessage } from "@/features/auth/components/form-message";

const initialState = { ok: false, message: "" };

export function LabsSignupForm() {
  const [state, action, pending] = useActionState(labsSignupAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <Input name="name" label="Full name" autoComplete="name" required />
      <Input name="mobile" label="Mobile number" inputMode="tel" autoComplete="tel" required />
      <PasswordInput name="pin" label="Create 6 digit PIN" inputMode="numeric" pattern="[0-9]{6}" autoComplete="new-password" required />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">I am here to</span>
        <select name="accountPurpose" className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" defaultValue="PROGRAM">
          <option value="PROGRAM">Apply for an AIRA Labs program</option>
          <option value="PRODUCT">Explore a product or service</option>
          <option value="PARTNERSHIP">Discuss a partnership</option>
          <option value="GENERAL">Make a general enquiry</option>
        </select>
      </label>
      <Button className="w-full" size="lg" disabled={pending}>{pending ? "Creating account..." : "Create my account"}</Button>
      <p className="text-center text-sm font-semibold text-brand-muted">Already have an account? <Link href="/aira-labs/sign-in" className="text-brand-red">Sign in</Link></p>
    </form>
  );
}

export function LabsSigninForm() {
  const [state, action, pending] = useActionState(mobilePinLoginAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <FormMessage message={state.message} ok={state.ok} />
      <Input name="mobile" label="Mobile number" inputMode="tel" autoComplete="tel" required />
      <PasswordInput name="pin" label="6 digit PIN" inputMode="numeric" pattern="[0-9]{6}" autoComplete="current-password" required />
      <div className="flex justify-end"><Link href="/aira-labs/forgot-pin" className="text-sm font-bold text-brand-red">Forgot PIN?</Link></div>
      <Button className="w-full" size="lg" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>
      <p className="text-center text-sm font-semibold text-brand-muted">New to AIRA Labs? <Link href="/aira-labs/sign-up" className="text-brand-red">Create an account</Link></p>
    </form>
  );
}

export function LabsPinRecoveryForm() {
  const [requestState, requestAction, requestPending] = useActionState(requestMobilePinResetAction, initialState);
  const [resetState, resetAction, resetPending] = useActionState(resetMobilePinWithOtpAction, initialState);
  return (
    <div className="space-y-8">
      <form action={requestAction} className="space-y-4"><FormMessage message={requestState.message} ok={requestState.ok} /><Input name="mobile" label="Mobile number" inputMode="tel" required /><Button className="w-full" disabled={requestPending}>{requestPending ? "Sending..." : "Send OTP"}</Button></form>
      <form action={resetAction} className="space-y-4 border-t border-black/10 pt-7"><FormMessage message={resetState.message} ok={resetState.ok} /><Input name="mobile" label="Mobile number" inputMode="tel" required /><Input name="otp" label="6 digit OTP" inputMode="numeric" pattern="[0-9]{6}" required /><PasswordInput name="pin" label="New 6 digit PIN" inputMode="numeric" pattern="[0-9]{6}" required /><PasswordInput name="confirmPin" label="Confirm PIN" inputMode="numeric" pattern="[0-9]{6}" required /><Button className="w-full" disabled={resetPending}>{resetPending ? "Resetting..." : "Reset PIN"}</Button></form>
    </div>
  );
}
