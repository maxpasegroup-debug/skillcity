"use client";

import { useActionState, useMemo } from "react";
import { CheckCircle2, FileText, Send, ShieldCheck, UserRound } from "lucide-react";
import { submitCareerApplicationAction, careerInitialState } from "@/actions/careers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CareerRoleSlug } from "@/features/careers/catalog";

const qualificationOptions = ["Plus Two / Higher Secondary", "Diploma", "Graduate", "Postgraduate", "MBA", "B.Tech / Engineering", "Other"];
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Not sure"];
const relationships = ["Father", "Mother", "Spouse", "Brother", "Sister", "Guardian", "Friend", "Other"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-bold text-brand-dark">{children}</span>;
}

function SectionTitle({ icon: Icon, title, note }: { icon: typeof UserRound; title: string; note?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-brand-dark">{title}</h2>
        {note ? <p className="mt-1 font-semibold leading-6 text-brand-muted">{note}</p> : null}
      </div>
    </div>
  );
}

function Textarea({ name, label, required, rows = 4 }: { name: string; label: string; required?: boolean; rows?: number }) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea name={name} required={required} rows={rows} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" />
    </label>
  );
}

function Select({ name, label, children, required, defaultValue = "" }: { name: string; label: string; children: React.ReactNode; required?: boolean; defaultValue?: string }) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select name={name} required={required} defaultValue={defaultValue} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
        {children}
      </select>
    </label>
  );
}

export function CareerApplicationForm({ role }: { role: { slug: CareerRoleSlug; title: string; category: { slug: string; title: string } } }) {
  const [state, action, pending] = useActionState(submitCareerApplicationAction, careerInitialState);
  const today = useMemo(() => new Date(), []);
  const todayValue = today.toISOString().slice(0, 10);
  const dayName = today.toLocaleDateString("en-IN", { weekday: "long" });

  if (state.ok) {
    return (
      <div className="rounded-lg border border-brand-gold/30 bg-brand-gold/10 p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-red text-white">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-3xl font-black text-brand-dark">Application received</h2>
        <p className="mt-3 font-semibold leading-7 text-brand-muted">{state.message}</p>
        {state.applicationId ? <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-brand-red">ID {state.applicationId}</p> : null}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-9">
      <input type="hidden" name="roleSlug" value={role.slug} />
      <input type="hidden" name="categorySlug" value={role.category.slug} />
      <input type="hidden" name="designation" value={role.title} />
      <input type="hidden" name="qualification" value="" />
      {state.message ? <p className="rounded-lg border border-brand-red/15 bg-brand-red/8 p-4 text-sm font-bold text-brand-red">{state.message}</p> : null}

      <section className="rounded-lg border border-black/8 bg-brand-beige/35 p-5 md:p-6">
        <SectionTitle icon={FileText} title="Candidate Information Form" note="For HR recruitment at AIRA Skill City." />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input name="applicationDate" label="Date" type="date" defaultValue={todayValue} required />
          <Input name="applicationDay" label="Day" defaultValue={dayName} required />
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle icon={UserRound} title="Personal Information" />
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="candidateName" label="Name" autoComplete="name" required />
          <Input name="fatherName" label="Father's Name" required />
          <Input name="dateOfBirth" label="Date of Birth" type="date" required />
          <Input name="age" label="Age" type="number" min={16} max={80} required />
          <Select name="education" label="Qualification" required>
            <option value="">Select qualification</option>
            {qualificationOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select name="bloodGroup" label="Blood Group" required>
            <option value="">Select blood group</option>
            {bloodGroups.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Select name="maritalStatus" label="Marital Status" required>
            <option value="">Select marital status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Other">Other</option>
          </Select>
          <Input name="nationality" label="Nationality" defaultValue="Indian" required />
          <Input name="aadhaarNo" label="Aadhaar No." inputMode="numeric" required />
          <Input name="email" label="E-mail ID" type="email" autoComplete="email" required />
          <Input name="mobile" label="Mobile Number" inputMode="tel" autoComplete="tel" required />
          <Input name="whatsapp" label="WhatsApp Number" inputMode="tel" autoComplete="tel" required />
          <Input name="district" label="Location / District" required />
          <Input name="preferredLocation" label="Preferred Location" required />
          <Input name="availability" label="Availability" placeholder="Immediate / 15 days / 30 days" required />
          <Select name="currentStatus" label="Current Occupation / Status" required>
            <option value="">Select current status</option>
            <option value="Student">Student</option>
            <option value="Working Professional">Working Professional</option>
            <option value="Business Owner">Business Owner</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Currently Exploring">Currently Exploring</option>
          </Select>
        </div>
        <Textarea name="birthMarks" label="Birth Mark(s)" rows={3} />
      </section>

      <section className="space-y-5">
        <SectionTitle icon={ShieldCheck} title="Nominee & Emergency Details" />
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="nomineeName" label="Nominee's Name" required />
          <Select name="nomineeRelationship" label="Nominee Relationship" required>
            <option value="">Select relationship</option>
            {relationships.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <Input name="emergencyContact" label="Emergency Contact Number" inputMode="tel" required />
          <Select name="emergencyRelationship" label="Emergency Contact Relationship" required>
            <option value="">Select relationship</option>
            {relationships.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle icon={FileText} title="Address" />
        <div className="grid gap-4 md:grid-cols-2">
          <Textarea name="presentAddress" label="Present Address" required />
          <Textarea name="permanentAddress" label="Permanent Address" required />
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle icon={FileText} title="Document Submission" />
        <div className="grid gap-4 md:grid-cols-2">
          <Select name="panSubmitted" label="PAN Card Copy Submitted" required>
            <option value="">Select</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </Select>
          <Select name="aadhaarSubmitted" label="Aadhaar Card Copy Submitted" required>
            <option value="">Select</option>
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </Select>
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle icon={FileText} title="Role Notes" note={`${role.title} applications are sent directly to the HR recruitment workflow.`} />
        <div className="grid gap-4 md:grid-cols-2">
          <Input name="experience" label="Experience" placeholder="Example: 2 years in counselling or sales" />
          <Input name="resumeUrl" label="Resume/CV Link" type="url" placeholder="Google Drive, Dropbox or portfolio link" />
          <Input name="profileUrl" label="LinkedIn / Portfolio" type="url" />
        </div>
        <Textarea name="relevantSkills" label="Relevant Skills" />
        <Textarea name="shortIntro" label="Short Introduction" required />
      </section>

      <section className="space-y-5">
        <SectionTitle icon={ShieldCheck} title="Declaration" />
        <Input name="candidateSignature" label="Candidate's Signature" placeholder="Type your full name" required />
        <label className="flex gap-3 rounded-lg border border-black/8 bg-white p-4 text-sm font-bold leading-6 text-brand-muted">
          <input type="checkbox" name="consent" className="mt-1 h-4 w-4 shrink-0" required />
          I confirm the information shared is accurate and consent to AIRA Skill City using my application details for recruitment communication and evaluation.
        </label>
      </section>

      <Button disabled={pending} size="lg" className="w-full rounded-full sm:w-auto">
        {pending ? "Submitting..." : `Apply for ${role.title}`}
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
