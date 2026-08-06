"use client";

import { useActionState } from "react";
import { KeyRound, Send } from "lucide-react";
import { generateStudentCredentialAction } from "@/actions/admissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/features/auth/components/form-message";

const initialState = { ok: false, message: "" };

type GenerateStudentCredentialFormProps = {
  applicationId: string;
  whatsapp: string;
  hasCredential?: boolean;
};

export function GenerateStudentCredentialForm({ applicationId, whatsapp, hasCredential }: GenerateStudentCredentialFormProps) {
  const [state, action, pending] = useActionState(generateStudentCredentialAction, initialState);

  return (
    <form action={action} className="mt-6 rounded-lg border border-black/10 bg-white p-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-brand-card p-3 text-brand-red">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-brand-dark">Student login access</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-brand-muted">
            Generate a temporary WhatsApp PIN after the Admission Cell approves the applicant.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input name="whatsapp" label="WhatsApp number" defaultValue={whatsapp} inputMode="tel" required />
        <Button className="self-end" disabled={pending}>
          <Send className="h-4 w-4" />
          {pending ? "Sending..." : hasCredential ? "Regenerate PIN" : "Generate PIN"}
        </Button>
      </div>
      <FormMessage message={state.message} ok={state.ok} />
    </form>
  );
}
