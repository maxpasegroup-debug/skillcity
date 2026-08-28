"use client";

import { useActionState } from "react";
import { createAttendanceSessionAction, createResourceAction, createStudentConcernAction, createTrainerAnnouncementAction, markAttendanceAction, reviewAssessmentAction, reviewReflectionAction, reviewSubmissionAction, scheduleTrainerClassAction } from "@/actions/trainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };
type Option = { id: string; name: string };

function Select({ name, label, children, required }: { name: string; label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">{children}</select></label>;
}

function Textarea({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} required={required} rows={4} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" /></label>;
}

export function AttendanceSessionForm({ batches }: { batches: Option[] }) {
  const [state, action, pending] = useActionState(createAttendanceSessionAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="batchId" label="Batch" required>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</Select><Input name="title" label="Class Title" required /><Input name="sessionDate" label="Date and Time" type="datetime-local" required /></div><Textarea name="notes" label="Notes" /><Button disabled={pending}>Create Session</Button></form>;
}

export function TrainerClassScheduleForm({ batches }: { batches: Option[] }) {
  const [state, action, pending] = useActionState(scheduleTrainerClassAction, initialState);
  return (
    <form action={action} className="space-y-5">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <div className="grid gap-4 md:grid-cols-3">
        <Select name="batchId" label="Batch" required>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</Select>
        <Select name="type" label="Class Type" required>
          <option value="LIVE_CLASS">Online class</option>
          <option value="OFFLINE_WORKSHOP">Offline class</option>
          <option value="MEETING">Hybrid / meeting</option>
        </Select>
        <Input name="startsAt" label="Starts At" type="datetime-local" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="title" label="Topic" required />
        <Input name="endsAt" label="Ends At" type="datetime-local" />
      </div>
      <Input name="location" label="Join Link or Venue" placeholder="Google Meet, Zoom, campus room, or centre location" />
      <Textarea name="description" label="Class Note" />
      <Button disabled={pending || batches.length === 0}>{pending ? "Scheduling..." : "Schedule Class"}</Button>
    </form>
  );
}

export function AttendanceRecordForm({ sessions, students }: { sessions: Option[]; students: Option[] }) {
  const [state, action, pending] = useActionState(markAttendanceAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="sessionId" label="Session" required>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}</Select><Select name="studentId" label="Student" required>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</Select><Select name="status" label="Status" required><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="EXCUSED">Excused</option></Select></div><Textarea name="note" label="Note" /><Button disabled={pending}>Save Attendance</Button></form>;
}

export function SubmissionReviewForm({ submissionId }: { submissionId: string }) {
  const [state, action, pending] = useActionState(reviewSubmissionAction, initialState);
  return <form action={action} className="mt-5 space-y-4"><DirectorFormMessage message={state.message} ok={state.ok} /><input type="hidden" name="submissionId" value={submissionId} /><div className="grid gap-4 md:grid-cols-2"><Select name="status" label="Decision" required><option value="APPROVED">Approve</option><option value="RETURNED">Return for improvement</option><option value="REJECTED">Reject</option></Select><Input name="score" label="Score" type="number" min={0} max={100} /></div><Textarea name="feedback" label="Feedback" required /><Button disabled={pending}>Submit Review</Button></form>;
}

export function ReflectionReviewForm({ reflectionId }: { reflectionId: string }) {
  const [state, action, pending] = useActionState(reviewReflectionAction, initialState);
  return <form action={action} className="mt-5 space-y-4"><DirectorFormMessage message={state.message} ok={state.ok} /><input type="hidden" name="reflectionId" value={reflectionId} /><Textarea name="comment" label="Trainer Comment" required /><label className="flex items-center gap-3 font-bold text-brand-muted"><input type="checkbox" name="flagConcern" value="true" />Flag concern</label><label className="flex items-center gap-3 font-bold text-brand-muted"><input type="checkbox" name="taraFollowUpRecommended" value="true" />Recommend Tara follow-up</label><Button disabled={pending}>Mark Reviewed</Button></form>;
}

export function AssessmentReviewForm({ assessmentId }: { assessmentId: string }) {
  const [state, action, pending] = useActionState(reviewAssessmentAction, initialState);
  return <form action={action} className="mt-5 space-y-4"><DirectorFormMessage message={state.message} ok={state.ok} /><input type="hidden" name="assessmentId" value={assessmentId} /><Input name="score" label="Adjusted Score" type="number" min={0} required /><Textarea name="feedback" label="Remarks" required /><Button disabled={pending}>Save Assessment Review</Button></form>;
}

export function ResourceForm({ batches }: { batches: Option[] }) {
  const [state, action, pending] = useActionState(createResourceAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="batchId" label="Batch"><option value="">All my batches</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</Select><Select name="type" label="Type" required><option value="VIDEO">Video</option><option value="PDF">PDF</option><option value="CODE_SAMPLE">Code Sample</option><option value="TEMPLATE">Template</option><option value="REFERENCE_LINK">Reference Link</option><option value="VOICE_NOTE">Voice Note</option></Select><Input name="categoryName" label="Category" required /></div><Input name="title" label="Title" required /><Input name="url" label="Resource URL" type="url" required /><Textarea name="description" label="Description" /><Button disabled={pending}>Save Resource</Button></form>;
}

export function TrainerAnnouncementForm({ batches }: { batches: Option[] }) {
  const [state, action, pending] = useActionState(createTrainerAnnouncementAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="batchId" label="Batch"><option value="">All my batches</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</Select><Select name="status" label="Status" required><option value="DRAFT">Draft</option><option value="SCHEDULED">Schedule</option><option value="PUBLISHED">Publish</option></Select><Input name="scheduledAt" label="Schedule" type="datetime-local" /></div><Input name="title" label="Title" required /><Textarea name="message" label="Message" required /><Button disabled={pending}>Save Announcement</Button></form>;
}

export function StudentConcernForm({ batches, students }: { batches: Option[]; students: Option[] }) {
  const [state, action, pending] = useActionState(createStudentConcernAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-2"><Select name="studentId" label="Student" required>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</Select><Select name="batchId" label="Batch"><option value="">Use active batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</Select></div><Input name="title" label="Concern Title" required /><Textarea name="notes" label="Notes" required /><label className="flex items-center gap-3 font-bold text-brand-muted"><input type="checkbox" name="taraFollowUpRecommended" value="true" />Recommend Tara follow-up</label><Button disabled={pending}>Save Concern</Button></form>;
}
