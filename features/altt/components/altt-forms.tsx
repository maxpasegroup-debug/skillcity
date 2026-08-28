"use client";

import { useActionState } from "react";
import { saveAssessmentResultAction, saveQuizAttemptAction, saveReflectionAction, saveSubmissionAction } from "@/actions/altt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

type ReflectionQuestion = { id: string; question: string; answers: Array<{ answer: string }> };

export function ReflectionForm({ dayId, questions }: { dayId: string; questions: ReflectionQuestion[] }) {
  const [state, action, pending] = useActionState(saveReflectionAction, initialState);
  if (questions.length === 0) return null;
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="dayId" value={dayId} />
      {questions.map((question) => (
        <label key={question.id} className="block">
          <span className="mb-2 block text-sm font-bold text-brand-dark">{question.question}</span>
          <textarea name={`reflection:${question.id}`} rows={3} defaultValue={question.answers[0]?.answer ?? ""} required className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" />
        </label>
      ))}
      <Button disabled={pending}>{pending ? "Saving..." : "Save Reflection"}</Button>
    </form>
  );
}

export function SubmissionForm({ dayId, stepId, activityId, defaultTitle }: { dayId: string; stepId?: string; activityId?: string; defaultTitle?: string }) {
  const [state, action, pending] = useActionState(saveSubmissionAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="dayId" value={dayId} />
      <input type="hidden" name="stepId" value={stepId ?? ""} />
      <input type="hidden" name="activityId" value={activityId ?? ""} />
      <Input name="title" label="Submission Title" defaultValue={defaultTitle} required />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Submission Type</span>
        <select name="type" className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold">
          <option value="TEXT">Text</option><option value="URL">URL</option><option value="GITHUB_REPOSITORY">GitHub Repository</option><option value="FILE">Uploaded File</option><option value="IMAGE">Image</option><option value="DOCUMENT">Document</option><option value="VIDEO_LINK">Video Link</option>
        </select>
      </label>
      <Input name="url" label="URL" type="url" />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Notes</span>
        <textarea name="content" rows={3} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" />
      </label>
      <div className="flex flex-wrap gap-3">
        <Button name="status" value="SUBMITTED" disabled={pending}>Submit</Button>
        <Button name="status" value="DRAFT" variant="secondary" disabled={pending}>Save Draft</Button>
      </div>
    </form>
  );
}

export function QuizAttemptForm({ dayId, stepId }: { dayId: string; stepId?: string }) {
  const [state, action, pending] = useActionState(saveQuizAttemptAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="dayId" value={dayId} />
      <input type="hidden" name="stepId" value={stepId ?? ""} />
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-brand-dark">Answers</span>
        <textarea name="answers" rows={4} required className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" />
      </label>
      <Button disabled={pending}>{pending ? "Saving..." : "Save Quiz Attempt"}</Button>
    </form>
  );
}

export function AssessmentResultForm({ dayId, stepId }: { dayId: string; stepId?: string }) {
  const [state, action, pending] = useActionState(saveAssessmentResultAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="dayId" value={dayId} />
      <input type="hidden" name="stepId" value={stepId ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">Type</span><select name="type" className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold"><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="FINAL">Final</option></select></label>
        <Input name="score" label="Score" type="number" required />
        <Input name="maxScore" label="Max Score" type="number" required />
      </div>
      <Input name="feedback" label="Feedback" />
      <Button disabled={pending}>{pending ? "Saving..." : "Save Assessment"}</Button>
    </form>
  );
}
