"use client";

import { useActionState } from "react";
import { createAutomationRuleAction, createCampusAction, createDepartmentAction, createEmployeeAction, createExecutiveReportAction, createInstitutionAction, saveSystemSettingAction } from "@/actions/executive";
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

export function InstitutionForm() {
  const [state, action, pending] = useActionState(createInstitutionAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Input name="name" label="Institution Name" required /><Input name="slug" label="Slug" required /><Input name="legalName" label="Legal Name" /></div><Button disabled={pending}>Create Institution</Button></form>;
}

export function CampusForm({ institutions }: { institutions: Option[] }) {
  const [state, action, pending] = useActionState(createCampusAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="institutionId" label="Institution" required>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input name="name" label="Campus Name" required /><Input name="slug" label="Slug" required /></div><div className="grid gap-4 md:grid-cols-2"><Input name="city" label="City" /><Input name="state" label="State" /></div><Textarea name="address" label="Address" /><Button disabled={pending}>Create Campus</Button></form>;
}

export function DepartmentForm({ institutions, campuses }: { institutions: Option[]; campuses: Option[] }) {
  const [state, action, pending] = useActionState(createDepartmentAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-4"><Select name="institutionId" label="Institution"><option value="">Platform</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="campusId" label="Campus"><option value="">All campuses</option>{campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input name="name" label="Department" required /><Input name="code" label="Code" required /></div><Textarea name="description" label="Description" /><Button disabled={pending}>Create Department</Button></form>;
}

export function EmployeeForm({ users, institutions, campuses, departments }: { users: Option[]; institutions: Option[]; campuses: Option[]; departments: Option[] }) {
  const [state, action, pending] = useActionState(createEmployeeAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="userId" label="User" required>{users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input name="employeeCode" label="Employee Code" /><Input name="title" label="Title" /></div><div className="grid gap-4 md:grid-cols-4"><Select name="institutionId" label="Institution"><option value="">Platform</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="campusId" label="Campus"><option value="">All campuses</option>{campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="departmentId" label="Department"><option value="">No department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select name="employmentType" label="Type" required><option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="CONTRACT">Contract</option><option value="INTERN">Intern</option></Select></div><Button disabled={pending}>Save Employee</Button></form>;
}

export function AutomationRuleForm() {
  const [state, action, pending] = useActionState(createAutomationRuleAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Input name="name" label="Rule Name" required /><Select name="triggerType" label="Trigger" required><option value="STUDENT_ABSENCE">Student misses 3 days</option><option value="TRAINER_PENDING_REVIEWS">Trainer pending reviews</option><option value="FEE_OVERDUE">Fee overdue</option><option value="CERTIFICATE_ISSUED">Certificate issued</option><option value="CHALLENGE_COMPLETED">Challenge completed</option><option value="MANUAL">Manual</option></Select><Select name="actionType" label="Action" required><option value="SEND_NOTIFICATION">Send notification</option><option value="SEND_EMAIL">Send email</option><option value="AWARD_COINS">Award Skill Coins</option><option value="CREATE_TASK">Create task</option><option value="ESCALATE">Escalate</option></Select></div><Textarea name="description" label="Description" /><Textarea name="conditions" label="Conditions JSON" required /><Textarea name="actionConfig" label="Action Config JSON" required /><label className="flex items-center gap-3 font-bold text-brand-muted"><input type="checkbox" name="active" value="true" defaultChecked />Active</label><Button disabled={pending}>Create Automation</Button></form>;
}

export function ExecutiveReportForm() {
  const [state, action, pending] = useActionState(createExecutiveReportAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><Select name="type" label="Report Type" required><option value="INSTITUTION">Institution</option><option value="PROGRAM">Program</option><option value="DEPARTMENT">Department</option><option value="FINANCIAL">Financial</option><option value="ADMISSIONS">Admissions</option><option value="TRAINER">Trainer</option><option value="STUDENT">Student</option><option value="COMMUNITY">Community</option><option value="MARKETPLACE">Marketplace</option><option value="AI_USAGE">AI Usage</option></Select><Input name="title" label="Title" required /><Textarea name="summary" label="Summary" required /><Button disabled={pending}>Save Report</Button></form>;
}

export function SystemSettingForm({ institutions }: { institutions: Option[] }) {
  const [state, action, pending] = useActionState(saveSystemSettingAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Select name="institutionId" label="Institution"><option value="">Platform</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input name="key" label="Setting Key" required /><label className="flex items-center gap-3 pt-8 font-bold text-brand-muted"><input type="checkbox" name="encrypted" value="true" />Encrypted</label></div><Textarea name="value" label="Value JSON" required /><Button disabled={pending}>Save Setting</Button></form>;
}
