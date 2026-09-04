"use client";

import { useActionState } from "react";
import type { CareerRecruitmentStage } from "@prisma/client";
import { addCareerNoteAction, careerInitialState, completeRMEvaluationAction, recordCareerInterviewResultAction, saveOfficeInterviewFormAction, scheduleCareerInterviewAction, startRMDevelopmentAction, updateCareerStageAction, updateRMTargetAction } from "@/actions/careers";
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

function Textarea({ name, label, required, defaultValue = "" }: { name: string; label: string; required?: boolean; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <textarea name={name} required={required} defaultValue={defaultValue} rows={3} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" />
    </label>
  );
}

type SavedOfficeInterviewForm = {
  rounds?: Array<{
    roundNumber?: number;
    interviewType?: string | null;
    interviewDateTime?: string | null;
    interviewerName?: string | null;
    remarks?: string | null;
    interviewerSignature?: string | null;
  }>;
  finalDecision?: { result?: string | null; remarks?: string | null };
  joiningDetails?: { dateOfJoining?: string | null; time?: string | null };
};

function getOfficeInterviewForm(metadata: unknown): SavedOfficeInterviewForm {
  if (!metadata || typeof metadata !== "object" || !("officeInterviewForm" in metadata)) return {};
  const form = (metadata as { officeInterviewForm?: unknown }).officeInterviewForm;
  if (!form || typeof form !== "object") return {};
  return form as SavedOfficeInterviewForm;
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

export function CareerOfficeInterviewForm({ applicationId, metadata }: { applicationId: string; metadata: unknown }) {
  const [state, action, pending] = useActionState(saveOfficeInterviewFormAction, careerInitialState);
  const saved = getOfficeInterviewForm(metadata);

  function roundValue(roundNumber: number, field: "interviewType" | "interviewDateTime" | "interviewerName" | "remarks" | "interviewerSignature") {
    return saved.rounds?.find((round) => round.roundNumber === roundNumber)?.[field] ?? "";
  }

  return (
    <form action={action} className="space-y-5 rounded-lg border border-brand-gold/25 bg-brand-beige/35 p-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-red">For Office Use Only</p>
        <h3 className="mt-2 text-2xl font-black text-brand-dark">Interview Form</h3>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((roundNumber) => (
          <div key={roundNumber} className="rounded-lg bg-white p-4">
            <p className="text-sm font-black uppercase text-brand-red">Round {roundNumber}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input name={`round${roundNumber}Type`} label="Interview Type" defaultValue={roundValue(roundNumber, "interviewType")} placeholder="HR / Technical / Director" />
              <Input name={`round${roundNumber}DateTime`} label="Interview Date & Time" defaultValue={roundValue(roundNumber, "interviewDateTime")} placeholder="DD.MM.YYYY, Day, Time" />
              <Input name={`round${roundNumber}InterviewerName`} label="Interviewer's Name" defaultValue={roundValue(roundNumber, "interviewerName")} />
              <Textarea name={`round${roundNumber}Remarks`} label="Remark(s)" defaultValue={roundValue(roundNumber, "remarks")} />
              <Input name={`round${roundNumber}Signature`} label="Interviewer's Signature" defaultValue={roundValue(roundNumber, "interviewerSignature")} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 rounded-lg bg-white p-4 md:grid-cols-2">
        <Select name="finalResult" label="Final Decision" defaultValue={saved.finalDecision?.result ?? ""}>
          <option value="">Pending</option>
          <option value="HOLD">Hold</option>
          <option value="SELECTED">Selected</option>
          <option value="NOT_SELECTED">Not-selected</option>
        </Select>
        <Textarea name="finalRemarks" label="Final Remarks" defaultValue={saved.finalDecision?.remarks ?? ""} />
        <Input name="joiningDate" label="Date of Joining" type="date" defaultValue={saved.joiningDetails?.dateOfJoining ?? ""} />
        <Input name="joiningTime" label="Time" type="time" defaultValue={saved.joiningDetails?.time ?? ""} />
      </div>
      <Button disabled={pending}>{pending ? "Saving..." : "Save Interview Form"}</Button>
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
