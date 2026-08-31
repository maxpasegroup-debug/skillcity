"use client";

import { useActionState } from "react";
import type { CareerRecruitmentStage } from "@prisma/client";
import { addCareerNoteAction, careerInitialState, completeRMEvaluationAction, recordCareerInterviewResultAction, scheduleCareerInterviewAction, startRMDevelopmentAction, updateCareerStageAction, updateRMTargetAction } from "@/actions/careers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";
import { recruitmentStages } from "@/features/careers/stages";

type UserOption = { id: string; name: string; roles: Array<{ role: { name: string } }> };
type InterviewOption = { id: string; scheduledAt: Date; interviewer: { name: string } | null };
type EmployeeOption = { id: string; title: string | null; user: { name: string; roles: Array<{ role: { name: string } }> } };

function Select({ name, label, children, defaultValue }: { name: string; label: string; children: React.ReactNode; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
        {children}
      </select>
    </label>
  );
}

function Textarea({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <textarea name={name} required={required} rows={3} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" />
    </label>
  );
}

export function CareerStageForm({ applicationId, currentStage }: { applicationId: string; currentStage: CareerRecruitmentStage }) {
  const [state, action, pending] = useActionState(updateCareerStageAction, careerInitialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <Select name="stage" label="Recruitment Stage" defaultValue={currentStage}>
        {recruitmentStages.map((stage) => <option key={stage} value={stage}>{stage.replaceAll("_", " ")}</option>)}
      </Select>
      <Textarea name="note" label="Stage Note" />
      <Button disabled={pending}>Update Stage</Button>
    </form>
  );
}

export function CareerNoteForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(addCareerNoteAction, careerInitialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <Textarea name="note" label="HR Note / Follow-up" required />
      <Button disabled={pending} variant="secondary">Add Note</Button>
    </form>
  );
}

export function CareerInterviewForm({ applicationId, users }: { applicationId: string; users: UserOption[] }) {
  const [state, action, pending] = useActionState(scheduleCareerInterviewAction, careerInitialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="grid gap-4 md:grid-cols-2">
        <Select name="interviewerId" label="Interviewer">
          <option value="">Assign later</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.roles.map((item) => item.role.name).join(", ")}</option>)}
        </Select>
        <Input name="scheduledAt" label="Interview Time" type="datetime-local" required />
        <Input name="mode" label="Mode" placeholder="Phone / Google Meet / Office" required />
        <Input name="meetingLink" label="Meeting Link" type="url" />
      </div>
      <Textarea name="notes" label="Interview Notes" />
      <Button disabled={pending}>Schedule Interview</Button>
    </form>
  );
}

export function CareerInterviewResultForm({ interviews }: { interviews: InterviewOption[] }) {
  const [state, action, pending] = useActionState(recordCareerInterviewResultAction, careerInitialState);
  if (interviews.length === 0) return <p className="font-semibold text-brand-muted">Schedule an interview before recording a result.</p>;
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Select name="interviewId" label="Interview">
        {interviews.map((interview) => <option key={interview.id} value={interview.id}>{interview.scheduledAt.toLocaleString()} - {interview.interviewer?.name ?? "Interviewer pending"}</option>)}
      </Select>
      <Input name="result" label="Result" placeholder="Shortlisted / Selected / Hold / Reject" required />
      <Textarea name="feedback" label="Feedback" />
      <Button disabled={pending} variant="secondary">Record Result</Button>
    </form>
  );
}

export function RMDevelopmentStartForm({ developmentId, employees, defaultTarget }: { developmentId: string; employees: EmployeeOption[]; defaultTarget: number }) {
  const [state, action, pending] = useActionState(startRMDevelopmentAction, careerInitialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="developmentId" value={developmentId} />
      <Select name="employeeId" label="Relationship Manager Employee">
        <option value="">Select employee</option>
        {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name} - {employee.title ?? employee.user.roles.map((item) => item.role.name).join(", ")}</option>)}
      </Select>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="developmentStart" label="Start Date" type="date" required />
        <Input name="targetAdmissions" label="Target Admissions" type="number" min={1} defaultValue={defaultTarget} required />
      </div>
      <Button disabled={pending}>Start RM Development</Button>
    </form>
  );
}

export function RMTargetForm({ developmentId, defaultTarget }: { developmentId: string; defaultTarget: number }) {
  const [state, action, pending] = useActionState(updateRMTargetAction, careerInitialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="developmentId" value={developmentId} />
      <Input name="targetAdmissions" label="Target Admissions" type="number" min={1} defaultValue={defaultTarget} required />
      <Textarea name="note" label="Target Note" />
      <Button disabled={pending} variant="secondary">Update Target</Button>
    </form>
  );
}

export function RMEvaluationForm({ developmentId }: { developmentId: string }) {
  const [state, action, pending] = useActionState(completeRMEvaluationAction, careerInitialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="developmentId" value={developmentId} />
      <Select name="status" label="Evaluation Status" defaultValue="EVALUATION_PENDING">
        <option value="IN_PROGRESS">In Development</option>
        <option value="EVALUATION_PENDING">Under Management Review</option>
        <option value="ELIGIBLE">Eligible for Franchise Manager</option>
        <option value="NOT_ELIGIBLE">Not Eligible</option>
        <option value="COMPLETED">Completed</option>
      </Select>
      <Input name="finalDecision" label="Final Decision" required />
      <Textarea name="evaluationNotes" label="Evaluation Notes" required />
      <Button disabled={pending}>Save Evaluation</Button>
    </form>
  );
}
