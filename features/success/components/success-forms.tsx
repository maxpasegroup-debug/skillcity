"use client";

import { useActionState } from "react";
import { createInternshipAction, createPlacementApplicationAction, createProjectAction, saveFounderProfileAction, savePlacementAction, saveResumeAction, updatePortfolioAction } from "@/actions/success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

function Select({ name, label, children, required }: { name: string; label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">{children}</select></label>;
}

function Textarea({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string | null }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} defaultValue={defaultValue ?? ""} rows={4} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" /></label>;
}

export function PortfolioForm({ portfolio }: { portfolio: { headline: string | null; bio: string | null; githubUrl: string | null; linkedinUrl: string | null; websiteUrl: string | null; visibility: string } }) {
  const [state, action, pending] = useActionState(updatePortfolioAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><Input name="headline" label="Headline" defaultValue={portfolio.headline ?? ""} /><Textarea name="bio" label="Bio" defaultValue={portfolio.bio} /><div className="grid gap-4 md:grid-cols-3"><Input name="githubUrl" label="GitHub" type="url" defaultValue={portfolio.githubUrl ?? ""} /><Input name="linkedinUrl" label="LinkedIn" type="url" defaultValue={portfolio.linkedinUrl ?? ""} /><Input name="websiteUrl" label="Personal Website" type="url" defaultValue={portfolio.websiteUrl ?? ""} /></div><Select name="visibility" label="Visibility" required><option value="PRIVATE">Private</option><option value="PUBLIC">Public</option><option value="UNLISTED">Unlisted</option></Select><Button disabled={pending}>Save Portfolio</Button></form>;
}

export function ProjectForm() {
  const [state, action, pending] = useActionState(createProjectAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><Input name="title" label="Project Title" required /><Textarea name="description" label="Description" /><div className="grid gap-4 md:grid-cols-2"><Input name="demoUrl" label="Demo URL" type="url" /><Input name="githubUrl" label="GitHub URL" type="url" /></div><div className="grid gap-4 md:grid-cols-3"><Input name="techStack" label="Tech Stack" /><Input name="tags" label="Tags" /><Input name="completedAt" label="Completion Date" type="date" /></div><label className="flex items-center gap-3 font-bold text-brand-muted"><input type="checkbox" name="featured" value="true" />Featured project</label><Button disabled={pending}>Add Project</Button></form>;
}

export function ResumeForm() {
  const [state, action, pending] = useActionState(saveResumeAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><Select name="type" label="Resume Type" required><option value="PROFESSIONAL">Professional</option><option value="FOUNDER">Founder</option><option value="DEVELOPER">Developer</option></Select><Input name="headline" label="Resume Headline" /><Textarea name="summary" label="AI-assisted Summary" /><Button disabled={pending}>Save Resume</Button></form>;
}

export function PlacementForm({ profile }: { profile?: { status: string; readinessScore: number; preferredRole: string | null; preferredLocation: string | null; salaryExpectation: string | null; mentorNotes: string | null } | null }) {
  const [state, action, pending] = useActionState(savePlacementAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-2"><Select name="status" label="Placement Status" required><option value="NOT_READY">Not Ready</option><option value="PREPARING">Preparing</option><option value="READY">Ready</option><option value="INTERVIEWING">Interviewing</option><option value="OFFERED">Offered</option><option value="PLACED">Placed</option></Select><Input name="readinessScore" label="Readiness Score" type="number" min={0} max={100} defaultValue={profile?.readinessScore ?? 0} /></div><div className="grid gap-4 md:grid-cols-3"><Input name="preferredRole" label="Preferred Role" defaultValue={profile?.preferredRole ?? ""} /><Input name="preferredLocation" label="Preferred Location" defaultValue={profile?.preferredLocation ?? ""} /><Input name="salaryExpectation" label="Salary Expectation" defaultValue={profile?.salaryExpectation ?? ""} /></div><Textarea name="mentorNotes" label="Mentor Notes" defaultValue={profile?.mentorNotes} /><Button disabled={pending}>Save Placement Profile</Button></form>;
}

export function PlacementApplicationForm() {
  const [state, action, pending] = useActionState(createPlacementApplicationAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Input name="company" label="Company" required /><Input name="role" label="Role" required /><Select name="status" label="Status" required><option value="APPLIED">Applied</option><option value="SHORTLISTED">Shortlisted</option><option value="INTERVIEW">Interview</option><option value="OFFER">Offer</option><option value="REJECTED">Rejected</option><option value="ACCEPTED">Accepted</option></Select></div><div className="grid gap-4 md:grid-cols-2"><Input name="interviewAt" label="Interview Date" type="datetime-local" /><Input name="offerAmount" label="Offer Amount" /></div><Textarea name="notes" label="Notes" /><Button disabled={pending}>Save Application</Button></form>;
}

export function InternshipForm() {
  const [state, action, pending] = useActionState(createInternshipAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Input name="company" label="Company" required /><Input name="role" label="Role" required /><Select name="status" label="Status" required><option value="PLANNED">Planned</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></Select></div><div className="grid gap-4 md:grid-cols-2"><Input name="startsAt" label="Start Date" type="date" /><Input name="endsAt" label="End Date" type="date" /></div><Textarea name="feedback" label="Mentor Feedback" /><Button disabled={pending}>Save Internship</Button></form>;
}

export function FounderProfileForm({ founder }: { founder?: { businessName: string | null; industry: string | null; revenueStage: string; websiteUrl: string | null; pitchDeckUrl: string | null; traction: string | null; customers: string | null } | null }) {
  const [state, action, pending] = useActionState(saveFounderProfileAction, initialState);
  return <form action={action} className="space-y-5"><DirectorFormMessage message={state.message} ok={state.ok} /><div className="grid gap-4 md:grid-cols-3"><Input name="businessName" label="Business Name" defaultValue={founder?.businessName ?? ""} /><Input name="industry" label="Industry" defaultValue={founder?.industry ?? ""} /><Select name="revenueStage" label="Revenue Stage" required><option value="IDEA">Idea</option><option value="VALIDATION">Validation</option><option value="PRE_REVENUE">Pre Revenue</option><option value="REVENUE">Revenue</option><option value="GROWTH">Growth</option></Select></div><div className="grid gap-4 md:grid-cols-2"><Input name="websiteUrl" label="Website" type="url" defaultValue={founder?.websiteUrl ?? ""} /><Input name="pitchDeckUrl" label="Pitch Deck" type="url" defaultValue={founder?.pitchDeckUrl ?? ""} /></div><Textarea name="traction" label="Traction" defaultValue={founder?.traction} /><Textarea name="customers" label="Customers" defaultValue={founder?.customers} /><Button disabled={pending}>Save Founder Profile</Button></form>;
}
