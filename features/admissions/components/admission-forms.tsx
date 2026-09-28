"use client";

import { useActionState } from "react";
import { createApplicationAction, createCommissionAction, createLeadAction, saveCommunicationAction, saveDocumentAction, scheduleCounsellingAction } from "@/actions/admissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };
type Option = { id: string; name: string };

function Select({ name, label, children, required }: { name: string; label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">{children}</select></label>;
}

function Textarea({ name, label }: { name: string; label: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} rows={4} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" /></label>;
}

export function LeadForm({ programs, sources, users }: { programs: Option[]; sources: Option[]; users: Option[] }) {
  const [state, action, pending] = useActionState(createLeadAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-2"><Input name="name" label="Name" required /><Input name="phone" label="Phone" required /></div><div className="grid gap-4 md:grid-cols-2"><Input name="email" label="Email" type="email" /><Input name="whatsapp" label="WhatsApp" /></div><div className="grid gap-4 md:grid-cols-2"><Input name="city" label="City" /><Input name="state" label="State" /></div><div className="grid gap-4 md:grid-cols-3"><Select name="programInterestedId" label="Program Interested"><option value="">Select program</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select><Select name="sourceId" label="Lead Source"><option value="">Select source</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select><Select name="assignedToId" label="Assigned To"><option value="">Unassigned</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></div><Select name="priority" label="Priority" required><option value="MEDIUM">Medium</option><option value="LOW">Low</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></Select><Textarea name="notes" label="Notes" /><Button disabled={pending}>{pending ? "Saving..." : "Create Lead"}</Button></form>;
}

export function CounsellingForm({ leads, batches }: { leads: Option[]; batches: Option[] }) {
  const [state, action, pending] = useActionState(scheduleCounsellingAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-2"><Select name="leadId" label="Lead" required>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select><Select name="batchId" label="Batch"><option value="">No batch</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></div><div className="grid gap-4 md:grid-cols-3"><Input name="scheduledAt" label="Date and Time" type="datetime-local" required /><Select name="outcome" label="Outcome" required><option value="SCHEDULED">Scheduled</option><option value="ATTENDED">Attended</option><option value="NO_SHOW">No Show</option><option value="RESCHEDULED">Rescheduled</option><option value="CONVERTED">Converted</option><option value="NOT_INTERESTED">Not Interested</option></Select><Input name="nextFollowUpAt" label="Next Follow-up" type="datetime-local" /></div><Input name="meetingLink" label="Meeting Link" type="url" /><Textarea name="notes" label="Notes" /><Button disabled={pending}>Schedule Counselling</Button></form>;
}

export function ApplicationForm({ leads, programs }: { leads: Option[]; programs: Option[] }) {
  const [state, action, pending] = useActionState(createApplicationAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="leadId" label="Lead" required>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select><Select name="programId" label="Program" required>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select><Select name="status" label="Status" required><option value="DRAFT">Draft</option><option value="SUBMITTED">Submitted</option></Select></div><Button disabled={pending}>Save Application</Button></form>;
}

export function DocumentForm({ applications, students }: { applications: Option[]; students: Option[] }) {
  const [state, action, pending] = useActionState(saveDocumentAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><Input name="title" label="Document Title" required /><div className="grid gap-4 md:grid-cols-3"><Select name="type" label="Type" required><option value="ID">ID</option><option value="PHOTO">Photo</option><option value="CERTIFICATE">Certificate</option><option value="ADDRESS_PROOF">Proof of Address</option><option value="OTHER">Other</option></Select><Select name="applicationId" label="Application"><option value="">No application</option>{applications.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select><Select name="studentId" label="Student"><option value="">No student</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div><Input name="fileUrl" label="File URL" type="url" required /><Select name="status" label="Status" required><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="REJECTED">Rejected</option></Select><Textarea name="rejectionReason" label="Rejection Reason" /><Button disabled={pending}>Save Document</Button></form>;
}

export function CommunicationForm({ leads }: { leads: Option[] }) {
  const [state, action, pending] = useActionState(saveCommunicationAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-4"><Select name="leadId" label="Lead"><option value="">No lead</option>{leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select><Select name="channel" label="Channel" required><option value="EMAIL">Email</option><option value="SMS">SMS</option><option value="WHATSAPP">WhatsApp</option><option value="INTERNAL_NOTIFICATION">Internal Notification</option></Select><Select name="status" label="Status" required><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="SENT">Sent</option></Select><Input name="scheduledAt" label="Schedule" type="datetime-local" /></div><Input name="subject" label="Subject" /><Textarea name="message" label="Message" /><Button disabled={pending}>Save Communication</Button></form>;
}

export function CommissionForm({ users, programs, invoices }: { users: Option[]; programs: Option[]; invoices: Option[] }) {
  const [state, action, pending] = useActionState(createCommissionAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="userId" label="BDM" required>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select><Select name="programId" label="Program"><option value="">No program</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select><Select name="invoiceId" label="Invoice"><option value="">No invoice</option>{invoices.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></div><div className="grid gap-4 md:grid-cols-4"><Select name="type" label="Type" required><option value="FIXED">Fixed</option><option value="PERCENTAGE">Percentage</option><option value="PROGRAM">Per Program</option><option value="REFERRAL">Referral</option><option value="MANUAL_ADJUSTMENT">Manual Adjustment</option></Select><Input name="baseAmount" label="Base Amount" type="number" defaultValue={0} /><Input name="rate" label="Rate" type="number" /><Input name="amount" label="Amount" type="number" required /></div><Textarea name="notes" label="Notes" /><Button disabled={pending}>Create Commission</Button></form>;
}
