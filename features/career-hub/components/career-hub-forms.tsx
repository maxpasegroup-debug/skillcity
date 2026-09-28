"use client";

import { useActionState } from "react";
import { applyToCareerOpportunityAction, createCareerEmployerAction, createCareerOpportunityAction, createCareerReferralAction, saveCareerTalentProfileAction, updateCareerApplicationStatusAction, updateCareerOpportunityStatusAction, verifyCareerEmployerAction, withdrawCareerApplicationAction } from "@/actions/career-hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { ok: false, message: "" };
type Option = { id: string; name: string };
type OrganizationOptions = { institutions: Option[]; divisions: Option[]; districts: Option[]; campuses: Option[]; departments: Option[]; employees: Option[]; employers: Option[] };

function Message({ state }: { state: { ok: boolean; message: string; code?: string } }) {
  return state.message ? <p className={`rounded-lg px-4 py-3 text-sm font-bold ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{state.message}{state.code ? ` Code: ${state.code}` : ""}</p> : null;
}

function Select({ name, label, options, required, defaultValue }: { name: string; label: string; options: Option[]; required?: boolean; defaultValue?: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} defaultValue={defaultValue} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>;
}

function Textarea({ name, label, defaultValue, required }: { name: string; label: string; defaultValue?: string; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} rows={4} defaultValue={defaultValue} required={required} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" /></label>;
}

const typeOptions = ["EMPLOYMENT", "FREELANCE", "CONTRACT", "INTERNSHIP", "APPRENTICESHIP", "PROJECT", "SELF_EMPLOYMENT"].map((id) => ({ id, name: id.replaceAll("_", " ") }));
const workModeOptions = ["ONSITE", "REMOTE", "HYBRID", "FLEXIBLE"].map((id) => ({ id, name: id }));
const opportunityStatusOptions = ["DRAFT", "OPEN", "PAUSED", "CLOSED", "ARCHIVED"].map((id) => ({ id, name: id }));
const visibilityOptions = ["INTERNAL", "AUTHENTICATED", "PUBLIC"].map((id) => ({ id, name: id }));

export function CareerTalentProfileForm({ profile }: { profile?: { headline: string | null; bio: string | null; skills: string[]; experienceSummary: string | null; educationSummary: string | null; preferredOpportunityTypes: string[]; workPreference: string | null; availability: string; location: string | null; visibility: string } | null }) {
  const [state, action, pending] = useActionState(saveCareerTalentProfileAction, initialState);
  return <form action={action} className="space-y-5"><Message state={state} /><div className="grid gap-4 md:grid-cols-2"><Input name="headline" label="Career Headline" defaultValue={profile?.headline ?? ""} /><Input name="location" label="Preferred Location" defaultValue={profile?.location ?? ""} /></div><Textarea name="bio" label="Professional Summary" defaultValue={profile?.bio ?? ""} /><Input name="skills" label="Skills" defaultValue={profile?.skills.join(", ") ?? ""} placeholder="Sales, React, Operations" /><Textarea name="experienceSummary" label="Experience Summary" defaultValue={profile?.experienceSummary ?? ""} /><Textarea name="educationSummary" label="Education Summary" defaultValue={profile?.educationSummary ?? ""} /><Input name="preferredOpportunityTypes" label="Preferred Opportunity Types" defaultValue={profile?.preferredOpportunityTypes.join(", ") ?? ""} placeholder="EMPLOYMENT, FREELANCE" /><div className="grid gap-4 md:grid-cols-3"><Select name="workPreference" label="Work Preference" options={workModeOptions} defaultValue={profile?.workPreference ?? ""} /><Select name="availability" label="Availability" options={["AVAILABLE", "OPEN_TO_OPPORTUNITIES", "NOT_AVAILABLE"].map((id) => ({ id, name: id.replaceAll("_", " ") }))} defaultValue={profile?.availability ?? "OPEN_TO_OPPORTUNITIES"} required /><Select name="visibility" label="Profile Visibility" options={["PRIVATE", "APPLICATION_ONLY", "DISCOVERABLE"].map((id) => ({ id, name: id.replaceAll("_", " ") }))} defaultValue={profile?.visibility ?? "APPLICATION_ONLY"} required /></div><Button disabled={pending}>{pending ? "Saving..." : "Save Career Profile"}</Button></form>;
}

export function CareerApplicationForm({ opportunityId }: { opportunityId: string }) {
  const [state, action, pending] = useActionState(applyToCareerOpportunityAction, initialState);
  return <form action={action} className="space-y-4"><Message state={state} /><input type="hidden" name="opportunityId" value={opportunityId} /><Textarea name="coverNote" label="Application Note" /><Input name="referralCode" label="Referral Code" placeholder="Optional NICE code" /><Button disabled={pending}>{pending ? "Submitting..." : "Apply"}</Button></form>;
}

export function CareerReferralForm({ opportunityId }: { opportunityId: string }) {
  const [state, action, pending] = useActionState(createCareerReferralAction, initialState);
  return <form action={action} className="space-y-3"><Message state={state} /><input type="hidden" name="opportunityId" value={opportunityId} /><Button variant="secondary" disabled={pending}>{pending ? "Creating..." : "Create Referral Code"}</Button></form>;
}

export function WithdrawCareerApplicationForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(withdrawCareerApplicationAction, initialState);
  return <form action={action} className="flex items-center gap-3"><input type="hidden" name="applicationId" value={applicationId} />{state.message ? <span className="text-sm font-bold text-brand-muted">{state.message}</span> : null}<Button variant="secondary" disabled={pending}>{pending ? "Withdrawing..." : "Withdraw"}</Button></form>;
}

export function CareerEmployerForm({ options }: { options: OrganizationOptions }) {
  const [state, action, pending] = useActionState(createCareerEmployerAction, initialState);
  return <form action={action} className="space-y-4"><Message state={state} /><div className="grid gap-4 md:grid-cols-2"><Input name="name" label="Employer Name" required /><Input name="code" label="Stable Code" placeholder="employer-code" required /></div><Textarea name="publicDescription" label="Public Description" required /><div className="grid gap-4 md:grid-cols-2"><Input name="websiteUrl" label="Website" type="url" /><Input name="industry" label="Industry" /></div><div className="grid gap-4 md:grid-cols-2"><Input name="contactName" label="Private Contact Name" /><Input name="contactEmail" label="Private Contact Email" type="email" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Select name="institutionId" label="AIRA Organization" options={options.institutions} required /><Select name="divisionId" label="Division" options={options.divisions} /><Select name="districtId" label="District" options={options.districts} /><Select name="campusId" label="Centre" options={options.campuses} /><Select name="departmentId" label="Department" options={options.departments} /></div><Button disabled={pending}>{pending ? "Creating..." : "Create Pending Employer"}</Button></form>;
}

export function CareerEmployerVerificationForm({ employerId, currentStatus }: { employerId: string; currentStatus: string }) {
  const [state, action, pending] = useActionState(verifyCareerEmployerAction, initialState);
  return <form action={action} className="grid gap-3 md:grid-cols-[180px_1fr_auto]"><input type="hidden" name="employerId" value={employerId} /><Select name="status" label="Verification" options={["PENDING", "VERIFIED", "SUSPENDED", "REJECTED"].map((id) => ({ id, name: id }))} defaultValue={currentStatus} required /><Input name="verificationNote" label="Review Note" /><Button className="self-end" disabled={pending}>{pending ? "Saving..." : "Update"}</Button><div className="md:col-span-3"><Message state={state} /></div></form>;
}

export function CareerOpportunityForm({ options }: { options: OrganizationOptions }) {
  const [state, action, pending] = useActionState(createCareerOpportunityAction, initialState);
  return <form action={action} className="space-y-4"><Message state={state} /><div className="grid gap-4 md:grid-cols-2"><Input name="title" label="Opportunity Title" required /><Input name="code" label="Stable Code" placeholder="frontend-intern-2026" required /></div><Textarea name="publicDescription" label="Public Description" required /><div className="grid gap-4 md:grid-cols-3"><Select name="employerId" label="Verified Employer" options={options.employers} required /><Select name="ownerEmployeeId" label="Responsible Employee" options={options.employees} required /><Select name="type" label="Opportunity Type" options={typeOptions} required /></div><div className="grid gap-4 md:grid-cols-3"><Select name="workMode" label="Work Mode" options={workModeOptions} required /><Input name="location" label="Location" /><Input name="requiredSkills" label="Required Skills" placeholder="React, Communication" /></div><div className="grid gap-4 md:grid-cols-3"><Input name="compensationSummary" label="Compensation Summary" /><Input name="applicationDeadline" label="Application Deadline" type="datetime-local" /><Input name="capacity" label="Capacity" type="number" /></div><div className="grid gap-4 md:grid-cols-2"><Select name="status" label="Status" options={opportunityStatusOptions} defaultValue="DRAFT" required /><Select name="visibility" label="Visibility" options={visibilityOptions} defaultValue="INTERNAL" required /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Select name="institutionId" label="AIRA Organization" options={options.institutions} required /><Select name="divisionId" label="Division" options={options.divisions} /><Select name="districtId" label="District" options={options.districts} /><Select name="campusId" label="Centre" options={options.campuses} /><Select name="departmentId" label="Department" options={options.departments} /></div><Button disabled={pending}>{pending ? "Creating..." : "Create Opportunity"}</Button></form>;
}

export function CareerOpportunityStatusForm({ opportunityId, status, visibility }: { opportunityId: string; status: string; visibility: string }) {
  const [state, action, pending] = useActionState(updateCareerOpportunityStatusAction, initialState);
  return <form action={action} className="grid gap-3 md:grid-cols-[180px_180px_auto]"><input type="hidden" name="opportunityId" value={opportunityId} /><Select name="status" label="Status" options={opportunityStatusOptions} defaultValue={status} required /><Select name="visibility" label="Visibility" options={visibilityOptions} defaultValue={visibility} required /><Button className="self-end" disabled={pending}>{pending ? "Saving..." : "Update"}</Button><div className="md:col-span-3"><Message state={state} /></div></form>;
}

export function CareerApplicationStatusForm({ applicationId, status }: { applicationId: string; status: string }) {
  const [state, action, pending] = useActionState(updateCareerApplicationStatusAction, initialState);
  return <form action={action} className="space-y-3"><input type="hidden" name="applicationId" value={applicationId} /><Select name="status" label="Application Status" options={["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED", "SELECTED"].map((id) => ({ id, name: id.replaceAll("_", " ") }))} defaultValue={status} required /><Input name="reviewNote" label="Private Review Note" /><Button disabled={pending}>{pending ? "Saving..." : "Update Application"}</Button><Message state={state} /></form>;
}
