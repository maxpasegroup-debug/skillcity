"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitCareerApplicationAction, careerInitialState } from "@/actions/careers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CareerRoleSlug } from "@/features/careers/catalog";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-bold text-brand-dark">{children}</span>;
}

function Textarea({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea name={name} required={required} rows={4} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" />
    </label>
  );
}

function Select({ name, label, children, required }: { name: string; label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select name={name} required={required} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
        {children}
      </select>
    </label>
  );
}

export function CareerApplicationForm({ role }: { role: { slug: CareerRoleSlug; title: string; category: { slug: string; title: string } } }) {
  const [state, action, pending] = useActionState(submitCareerApplicationAction, careerInitialState);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-brand-gold/30 bg-brand-gold/10 p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-red text-white">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-3xl font-black text-brand-dark">Application received</h2>
        <p className="mt-3 font-semibold leading-7 text-brand-muted">{state.message}</p>
        {state.applicationId ? <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-brand-red">ID {state.applicationId}</p> : null}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="roleSlug" value={role.slug} />
      <input type="hidden" name="categorySlug" value={role.category.slug} />
      {state.message ? <p className="rounded-lg border border-brand-red/15 bg-brand-red/8 p-4 text-sm font-bold text-brand-red">{state.message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Input name="candidateName" label="Candidate Name" autoComplete="name" required />
        <Input name="mobile" label="Mobile Number" inputMode="tel" autoComplete="tel" required />
        <Input name="whatsapp" label="WhatsApp Number" inputMode="tel" autoComplete="tel" required />
        <Input name="email" label="Email" type="email" autoComplete="email" required />
        <Input name="district" label="Location / District" required />
        <Input name="preferredLocation" label="Preferred Location" required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select name="education" label="Education" required>
          <option value="">Select</option>
          <option value="Plus Two / Higher Secondary">Plus Two / Higher Secondary</option>
          <option value="Diploma">Diploma</option>
          <option value="Graduate">Graduate</option>
          <option value="Postgraduate">Postgraduate</option>
          <option value="Other">Other</option>
        </Select>
        <Select name="currentStatus" label="Current Occupation / Status" required>
          <option value="">Select</option>
          <option value="Student">Student</option>
          <option value="Working Professional">Working Professional</option>
          <option value="Business Owner">Business Owner</option>
          <option value="Freelancer">Freelancer</option>
          <option value="Currently Exploring">Currently Exploring</option>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input name="experience" label="Experience" placeholder="Example: 2 years in sales" />
        <Input name="availability" label="Availability" placeholder="Immediate / 15 days / 30 days" required />
        <Input name="resumeUrl" label="Resume/CV Link" type="url" placeholder="Google Drive, Dropbox or portfolio link" />
        <Input name="profileUrl" label="LinkedIn / Portfolio" type="url" />
      </div>

      <Textarea name="relevantSkills" label="Relevant Skills" />
      <Textarea name="shortIntro" label="Short Introduction" required />

      <label className="flex gap-3 rounded-lg border border-black/8 bg-white p-4 text-sm font-bold leading-6 text-brand-muted">
        <input type="checkbox" name="consent" className="mt-1 h-4 w-4 shrink-0" required />
        I consent to AIRA Skill City using my application details for recruitment communication and evaluation.
      </label>

      <Button disabled={pending} size="lg" className="w-full rounded-full sm:w-auto">
        {pending ? "Submitting..." : "Apply for this role"}
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
