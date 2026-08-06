"use client";

import { useActionState } from "react";
import { CheckCircle2, Clock3, Search } from "lucide-react";
import { checkApplicationStatusAction, type ApplicationStatusState } from "@/actions/public-application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ApplicationStatusState = {
  ok: false,
  message: ""
};

export function ApplicationStatusForm() {
  const [state, action, pending] = useActionState(checkApplicationStatusAction, initialState);
  const Icon = state.ok ? CheckCircle2 : Clock3;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form action={action} className="rounded-lg border border-black/8 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-red text-white">
          <Search className="h-7 w-7" />
        </div>
        <h2 className="mt-8 text-3xl font-black uppercase leading-none text-black">Check application.</h2>
        <p className="mt-4 font-semibold leading-7 text-brand-muted">
          Use the WhatsApp number submitted in your NEXA AI application.
        </p>
        <div className="mt-7 space-y-5">
          <Input name="whatsapp" label="WhatsApp number" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" required />
          <Button className="w-full rounded-full" size="lg" disabled={pending}>
            {pending ? "Checking..." : "Check Status"}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border border-brand-gold/25 bg-white p-6 shadow-soft sm:p-8">
        {state.message ? (
          <>
            <div className={`flex h-14 w-14 items-center justify-center rounded-lg ${state.ok ? "bg-brand-red text-white" : "bg-brand-beige text-brand-red"}`}>
              <Icon className="h-7 w-7" />
            </div>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-brand-red">{state.status ?? "Status"}</p>
            <h3 className="mt-3 text-4xl font-black uppercase leading-none text-black">{state.title ?? "Application status"}</h3>
            {state.program ? <p className="mt-4 text-lg font-black text-brand-dark">{state.program}</p> : null}
            <p className="mt-5 text-lg font-semibold leading-8 text-brand-muted">{state.message}</p>
            {state.nextStep ? <p className="mt-6 rounded-lg bg-[#fbfaf7] p-5 font-bold leading-7 text-brand-dark">{state.nextStep}</p> : null}
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-beige text-brand-red">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-brand-red">Application Status</p>
            <h3 className="mt-3 text-4xl font-black uppercase leading-none text-black">No login before approval.</h3>
            <p className="mt-5 text-lg font-semibold leading-8 text-brand-muted">
              If you are approved, the Admission Cell will send a WhatsApp PIN. Until then your dashboard remains locked.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
