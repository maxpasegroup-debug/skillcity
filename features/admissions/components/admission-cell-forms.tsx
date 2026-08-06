"use client";

import type React from "react";
import { useActionState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { reviewApplicationAction, saveAdmissionProgramAction } from "@/actions/admissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

export function ApplicationReviewForm({ applicationId, defaultStatus }: { applicationId: string; defaultStatus: string }) {
  const [state, action, pending] = useActionState(reviewApplicationAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <Select name="status" label="Decision" defaultValue={defaultStatus}>
        <option value="UNDER_REVIEW">Under Review</option>
        <option value="APPROVED">Approve</option>
        <option value="REJECTED">Reject</option>
        <option value="SUBMITTED">Return to Submitted</option>
      </Select>
      <Textarea name="note" label="Review Note" placeholder="Add counselling notes, eligibility comments, or next action." />
      <Button disabled={pending} className="w-full">
        <CheckCircle2 className="h-5 w-5" />
        {pending ? "Saving..." : "Save Review"}
      </Button>
    </form>
  );
}

type AdmissionProgramFormValue = {
  id?: string;
  name?: string;
  slug?: string;
  category?: string | null;
  description?: string;
  durationDays?: number;
  status?: string;
  feeType?: string;
  admissionStatus?: string;
  displayOrder?: number;
  publicVisible?: boolean;
  thumbnail?: string | null;
};

export function AdmissionProgramForm({ program }: { program?: AdmissionProgramFormValue }) {
  const [state, action, pending] = useActionState(saveAdmissionProgramAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="id" value={program?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="name" label="Program Name" required defaultValue={program?.name ?? ""} />
        <Input name="slug" label="Slug" required placeholder="startup-skool" defaultValue={program?.slug ?? ""} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="category" label="Category" required placeholder="Entrepreneurship" defaultValue={program?.category ?? ""} />
        <Input name="displayOrder" label="Display Order" type="number" required defaultValue={program?.displayOrder ?? 0} />
      </div>
      <Textarea name="description" label="Description" required placeholder="Write a clear admission-facing program description." defaultValue={program?.description ?? ""} />
      <div className="grid gap-4 md:grid-cols-4">
        <Input name="durationDays" label="Duration Days" type="number" required defaultValue={program?.durationDays ?? 60} />
        <Select name="status" label="Content Status" defaultValue={program?.status ?? "ACTIVE"}>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Select name="feeType" label="Fee Type" defaultValue={program?.feeType ?? "PAID"}>
          <option value="PAID">Paid</option>
          <option value="FREE">Free</option>
        </Select>
        <Select name="admissionStatus" label="Admission Status" defaultValue={program?.admissionStatus ?? "OPEN"}>
          <option value="OPEN">Open</option>
          <option value="WAITLIST">Waitlist</option>
          <option value="CLOSED">Closed</option>
        </Select>
      </div>
      <Input name="thumbnail" label="Thumbnail URL" type="url" defaultValue={program?.thumbnail ?? ""} />
      <label className="flex items-center gap-3 rounded-lg bg-brand-card p-4 text-sm font-bold text-brand-dark">
        <input name="publicVisible" value="on" type="checkbox" defaultChecked={program?.publicVisible ?? true} />
        Show publicly in admissions
      </label>
      <Button disabled={pending}>
        <Save className="h-5 w-5" />
        {pending ? "Saving..." : "Save Program"}
      </Button>
    </form>
  );
}

function Select({
  label,
  name,
  children,
  defaultValue
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, name, required, placeholder, defaultValue }: { label: string; name: string; required?: boolean; placeholder?: string; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        rows={4}
        className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark placeholder:text-brand-muted/70 focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
      />
    </label>
  );
}
