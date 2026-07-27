"use client";

import { useActionState } from "react";
import {
  addActivityToDayAction,
  assignTrainerAction,
  createBatchAction,
  createBlueprintAction,
  createCalendarEventAction,
  createContentLibraryAction,
  createDirectorAnnouncementAction,
  saveProgramAction
} from "@/actions/director";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "./director-form-message";

const initialState = { ok: false, message: "" };

type Option = { id: string; name: string };

function SelectField({ label, name, children, required }: { label: string; name: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select
        name={name}
        required={required}
        className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
      >
        {children}
      </select>
    </label>
  );
}

function TextareaField({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <textarea
        name={name}
        required={required}
        rows={4}
        className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
      />
    </label>
  );
}

export function ProgramForm() {
  const [state, action, pending] = useActionState(saveProgramAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="name" label="Name" required />
        <Input name="slug" label="Slug" required />
      </div>
      <TextareaField name="description" label="Description" required />
      <div className="grid gap-4 md:grid-cols-3">
        <Input name="durationDays" label="Duration" type="number" required />
        <Input name="journeyVersion" label="Journey Version" type="number" defaultValue={1} required />
        <SelectField name="status" label="Status" required>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </SelectField>
      </div>
      <Input name="thumbnail" label="Thumbnail URL" type="url" />
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-bold text-brand-dark"><input name="enrollmentOpen" value="on" type="checkbox" /> Enrollment Open</label>
        <label className="flex items-center gap-2 text-sm font-bold text-brand-dark"><input name="archive" value="on" type="checkbox" /> Archive</label>
      </div>
      <Button disabled={pending}>{pending ? "Saving..." : "Save Program"}</Button>
    </form>
  );
}

export function BlueprintForm({ programs, journeys }: { programs: Option[]; journeys: Array<Option & { programId: string }> }) {
  const [state, action, pending] = useActionState(createBlueprintAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Input name="name" label="Blueprint Name" required />
      <TextareaField name="description" label="Description" />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="programId" label="Program" required>
          {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
        </SelectField>
        <SelectField name="journeyId" label="Journey">
          <option value="">No journey selected</option>
          {journeys.map((journey) => <option key={journey.id} value={journey.id}>{journey.name}</option>)}
        </SelectField>
      </div>
      <Input name="versionTitle" label="Version Title" defaultValue="Version 1" required />
      <Button disabled={pending}>{pending ? "Creating..." : "Create Blueprint"}</Button>
    </form>
  );
}

export function BatchForm({ programs, journeys }: { programs: Option[]; journeys: Array<Option & { programId: string }> }) {
  const [state, action, pending] = useActionState(createBatchAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Input name="name" label="Batch Name" required />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="programId" label="Program" required>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</SelectField>
        <SelectField name="journeyId" label="Journey"><option value="">Select later</option>{journeys.map((journey) => <option key={journey.id} value={journey.id}>{journey.name}</option>)}</SelectField>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Input name="startsAt" label="Start Date" type="date" />
        <Input name="endsAt" label="End Date" type="date" />
        <Input name="enrollmentLimit" label="Enrollment Limit" type="number" />
        <SelectField name="status" label="Status" required><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></SelectField>
      </div>
      <Button disabled={pending}>{pending ? "Creating..." : "Create Batch"}</Button>
    </form>
  );
}

export function TrainerAssignmentForm({ trainers, batches }: { trainers: Option[]; batches: Option[] }) {
  const [state, action, pending] = useActionState(assignTrainerAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="trainerId" label="Trainer" required>{trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}</SelectField>
        <SelectField name="batchId" label="Batch" required>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</SelectField>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Input name="role" label="Role" defaultValue="Trainer" required />
        <Input name="startsAt" label="Start Date" type="date" />
        <Input name="endsAt" label="End Date" type="date" />
      </div>
      <Button disabled={pending}>{pending ? "Assigning..." : "Assign Trainer"}</Button>
    </form>
  );
}

export function CommunicationForm({ programs, batches }: { programs: Option[]; batches: Option[] }) {
  const [state, action, pending] = useActionState(createDirectorAnnouncementAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="type" label="Type" required>
          {["GENERAL", "EMERGENCY", "MOTIVATION", "ASSIGNMENT", "HOLIDAY", "PLACEMENT", "FEE_REMINDER", "OFFLINE_EVENT"].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
        </SelectField>
        <SelectField name="recipientType" label="Recipients" required>
          <option value="PLATFORM">Entire Platform</option><option value="PROGRAM">Program</option><option value="BATCH">Batch</option><option value="STUDENTS">Specific Students</option>
        </SelectField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="programId" label="Program"><option value="">Any program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</SelectField>
        <SelectField name="batchId" label="Batch"><option value="">Any batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</SelectField>
      </div>
      <Input name="title" label="Title" required />
      <TextareaField name="message" label="Message" required />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField name="status" label="Status" required><option value="DRAFT">Draft</option><option value="SCHEDULED">Schedule Later</option><option value="PUBLISHED">Publish Now</option></SelectField>
        <Input name="scheduledAt" label="Schedule Time" type="datetime-local" />
      </div>
      <Button disabled={pending}>{pending ? "Saving..." : "Save Communication"}</Button>
    </form>
  );
}

export function ContentLibraryForm({ programs }: { programs: Option[] }) {
  const [state, action, pending] = useActionState(createContentLibraryAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Input name="title" label="Title" required />
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField name="type" label="Type" required><option value="VIDEO">Video</option><option value="PDF">PDF</option><option value="ARTICLE">Article</option><option value="VOICE_NOTE">Voice Note</option><option value="EXTERNAL_LINK">External Link</option></SelectField>
        <SelectField name="programId" label="Program"><option value="">Shared library</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</SelectField>
        <Input name="duration" label="Duration" type="number" />
      </div>
      <Input name="url" label="Asset URL" type="url" required />
      <TextareaField name="description" label="Description" />
      <Button disabled={pending}>{pending ? "Saving..." : "Save Content"}</Button>
    </form>
  );
}

export function CalendarEventForm({ programs, batches, journeys }: { programs: Option[]; batches: Option[]; journeys: Option[] }) {
  const [state, action, pending] = useActionState(createCalendarEventAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Input name="title" label="Event Title" required />
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField name="type" label="Type" required>{["LIVE_CLASS", "OFFLINE_WORKSHOP", "HOLIDAY", "RESCHEDULED_EVENT", "ASSESSMENT", "MEETING"].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</SelectField>
        <Input name="startsAt" label="Starts At" type="datetime-local" required />
        <Input name="endsAt" label="Ends At" type="datetime-local" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField name="programId" label="Program"><option value="">Any program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</SelectField>
        <SelectField name="journeyId" label="Journey"><option value="">Any journey</option>{journeys.map((journey) => <option key={journey.id} value={journey.id}>{journey.name}</option>)}</SelectField>
        <SelectField name="batchId" label="Batch"><option value="">Any batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</SelectField>
      </div>
      <Input name="location" label="Location" />
      <TextareaField name="description" label="Description" />
      <Button disabled={pending}>{pending ? "Saving..." : "Save Event"}</Button>
    </form>
  );
}

export function DayActivityForm({ dayId }: { dayId: string }) {
  const [state, action, pending] = useActionState(addActivityToDayAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="dayId" value={dayId} />
      <Input name="title" label="Activity Title" required />
      <div className="grid gap-4 md:grid-cols-4">
        <SelectField name="type" label="Type" required>
          {["VIDEO", "LIVE", "ARTICLE", "PDF", "QUIZ", "TASK", "PROJECT", "REFLECTION", "MEETING", "OFFLINE", "ASSESSMENT", "VOICE_NOTE", "AI_CHAT", "LINK"].map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
        </SelectField>
        <Input name="duration" label="Duration" type="number" />
        <Input name="points" label="XP" type="number" defaultValue={10} required />
        <label className="mt-8 flex items-center gap-2 text-sm font-bold text-brand-dark"><input name="required" value="on" type="checkbox" defaultChecked /> Required</label>
      </div>
      <TextareaField name="description" label="Description" />
      <Button disabled={pending}>{pending ? "Adding..." : "Add Activity"}</Button>
    </form>
  );
}
