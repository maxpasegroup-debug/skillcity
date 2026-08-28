"use client";

import type React from "react";
import { useActionState } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import { saveStudentActivationProfileAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/features/auth/components/form-message";

const initialState = { ok: false, message: "" };

type StudentActivationProfileFormProps = {
  defaults: {
    whatsapp?: string | null;
    city?: string | null;
    state?: string | null;
    educationOrWork?: string | null;
    learningGoal?: string | null;
    preferredLanguage?: string | null;
    availability?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
  };
};

export function StudentActivationProfileForm({ defaults }: StudentActivationProfileFormProps) {
  const [state, action, pending] = useActionState(saveStudentActivationProfileAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-brand-gold/25 bg-brand-beige/60 p-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-red text-white">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-black text-brand-dark">Student activation profile</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-brand-muted">
            This helps Skill City place you in the right batch rhythm and lets Tara understand your learning context.
          </p>
        </div>
      </div>

      <FormMessage message={state.message} ok={state.ok} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="whatsapp" label="WhatsApp Number" inputMode="tel" defaultValue={defaults.whatsapp ?? ""} required />
        <Input name="city" label="City" defaultValue={defaults.city ?? ""} required />
        <Input name="state" label="State" defaultValue={defaults.state ?? ""} required />
        <Select name="educationOrWork" label="Current Status" defaultValue={defaults.educationOrWork ?? ""} required>
          <option value="">Select current status</option>
          <option>School student</option>
          <option>College student</option>
          <option>Graduate</option>
          <option>Working professional</option>
          <option>Founder / business owner</option>
          <option>Looking for internship</option>
        </Select>
        <Select name="preferredLanguage" label="Preferred Language" defaultValue={defaults.preferredLanguage ?? ""} required>
          <option value="">Select language</option>
          <option>English</option>
          <option>Malayalam</option>
          <option>Hindi</option>
          <option>Mixed English + Malayalam</option>
        </Select>
        <Select name="availability" label="Learning Availability" defaultValue={defaults.availability ?? ""} required>
          <option value="">Select availability</option>
          <option>Morning</option>
          <option>Afternoon</option>
          <option>Evening</option>
          <option>Weekend</option>
          <option>Flexible</option>
        </Select>
        <Input name="guardianName" label="Guardian Name" defaultValue={defaults.guardianName ?? ""} />
        <Input name="guardianPhone" label="Guardian Phone" inputMode="tel" defaultValue={defaults.guardianPhone ?? ""} />
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Why are you joining Skill City?</span>
        <textarea
          name="learningGoal"
          rows={5}
          defaultValue={defaults.learningGoal ?? ""}
          required
          className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base font-semibold text-brand-dark placeholder:text-brand-muted/70 focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
          placeholder="Tell us what you want to learn, build, earn or improve in the next 6 months."
        />
      </label>

      <Button className="w-full rounded-full" size="lg" disabled={pending}>
        {pending ? "Saving profile..." : "Enter Dashboard"}
        <ArrowRight className="h-5 w-5" />
      </Button>
    </form>
  );
}

function Select({
  name,
  label,
  defaultValue,
  children,
  required
}: {
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
      >
        {children}
      </select>
    </label>
  );
}
