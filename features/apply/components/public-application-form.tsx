"use client";

import type React from "react";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";
import { submitPublicApplicationAction, publicApplicationInitialState } from "@/actions/public-application";
import { launchApplicationPrograms, type LaunchApplicationProgramSlug } from "@/features/apply/programs";
import { Button } from "@/components/ui/button";

type FormValues = {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  educationOrWork: string;
  preferredCounsellingTime: string;
  goal: string;
};

const initialValues: FormValues = {
  name: "",
  phone: "",
  whatsapp: "",
  email: "",
  city: "",
  state: "",
  educationOrWork: "",
  preferredCounsellingTime: "",
  goal: ""
};

const steps = [
  { title: "Welcome", helper: "NEXA will guide your application." },
  { title: "Program", helper: "Choose the path you want to apply for." },
  { title: "Basic Details", helper: "Tell the Admission Cell who you are." },
  { title: "Goal", helper: "Share your current stage and what you want." },
  { title: "Review", helper: "Check once before submission." }
];

export function PublicApplicationForm({ initialProgramSlug, referralId }: { initialProgramSlug?: string; referralId?: string }) {
  const firstProgram = launchApplicationPrograms.find((program) => program.slug === initialProgramSlug) ?? launchApplicationPrograms[0];
  const [selectedProgramSlug, setSelectedProgramSlug] = useState<LaunchApplicationProgramSlug>(firstProgram.slug);
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [clientMessage, setClientMessage] = useState("");
  const [state, action, pending] = useActionState(submitPublicApplicationAction, publicApplicationInitialState);
  const selectedProgram = useMemo(
    () => launchApplicationPrograms.find((program) => program.slug === selectedProgramSlug) ?? launchApplicationPrograms[0],
    [selectedProgramSlug]
  );
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (clientMessage) setClientMessage("");
  }

  function canContinue() {
    if (currentStep === 0 || currentStep === 1) return true;
    if (currentStep === 2) return values.name.trim() && values.phone.trim() && values.whatsapp.trim() && values.city.trim() && values.state.trim();
    if (currentStep === 3) return values.educationOrWork.trim() && values.preferredCounsellingTime.trim() && values.goal.trim().length >= 10;
    return true;
  }

  function nextStep() {
    if (!canContinue()) {
      setClientMessage("Please complete this step before moving ahead.");
      return;
    }
    setClientMessage("");
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  if (state.ok) {
    return (
      <div className="rounded-lg border border-brand-gold/30 bg-white p-8 shadow-soft">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-red text-white">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.2em] text-brand-gold">Application submitted</p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-none text-black sm:text-5xl">Under review.</h1>
        <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-brand-muted">{state.message}</p>
        <div className="mt-8 rounded-lg bg-[#fbfaf7] p-5">
          <p className="text-sm font-black text-brand-dark">Application ID</p>
          <p className="mt-2 break-all text-sm font-semibold text-brand-muted">{state.applicationId}</p>
        </div>
        <Button asChild className="mt-6 rounded-full" size="lg" variant="secondary">
          <Link href="/application-status">Check Status Later</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
      <aside className="space-y-5">
        <div className="sticky top-28 rounded-lg border border-brand-gold/30 bg-white p-7 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-red text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-black uppercase text-brand-red">NEXA AI</p>
              <p className="text-sm font-semibold text-brand-muted">Admission onboarding guide</p>
            </div>
          </div>
          <p className="mt-7 text-2xl font-black leading-tight text-black">{getNexaMessage(currentStep, selectedProgram.shortTitle)}</p>
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-brand-beige">
            <div className="h-full rounded-full bg-brand-red transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm font-black text-brand-muted">{progress}% complete</p>
          <div className="mt-7 space-y-3">
            {steps.map((step, index) => (
              <button
                key={step.title}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`flex w-full items-center gap-3 rounded-lg p-4 text-left transition ${
                  index === currentStep ? "bg-brand-red text-white" : index < currentStep ? "bg-[#fbfaf7] text-brand-dark" : "bg-white text-brand-muted"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${index === currentStep ? "bg-white text-brand-red" : "bg-brand-beige text-brand-dark"}`}>
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-black">{step.title}</span>
                  <span className={`mt-1 block text-xs font-semibold ${index === currentStep ? "text-white/80" : "text-brand-muted"}`}>{step.helper}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <form action={action} className="rounded-lg border border-black/8 bg-white p-6 shadow-soft sm:p-8">
        <HiddenApplicationFields selectedProgramSlug={selectedProgram.slug} referralId={referralId} values={values} />

        <div className="min-h-[520px]">
          {clientMessage || (state.message && !state.ok) ? (
            <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-bold text-brand-red">{clientMessage || state.message}</p>
          ) : null}

          {currentStep === 0 ? <WelcomeStep selectedProgramTitle={selectedProgram.title} /> : null}
          {currentStep === 1 ? <ProgramStep selectedProgramSlug={selectedProgramSlug} onSelect={setSelectedProgramSlug} /> : null}
          {currentStep === 2 ? <BasicDetailsStep values={values} onChange={updateValue} /> : null}
          {currentStep === 3 ? <GoalStep values={values} onChange={updateValue} /> : null}
          {currentStep === 4 ? <ReviewStep values={values} selectedProgramTitle={selectedProgram.title} /> : null}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-black/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="secondary" disabled={currentStep === 0 || pending} onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}>
            <ArrowLeft className="h-5 w-5" />
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" className="h-14 rounded-full px-8" onClick={nextStep}>
              Continue
              <ArrowRight className="h-5 w-5" />
            </Button>
          ) : (
            <Button disabled={pending} className="h-14 rounded-full px-8">
              {pending ? "Submitting..." : "Submit Application"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function getNexaMessage(step: number, program: string) {
  const messages = [
    "Welcome. I will keep this simple and help you apply with clarity.",
    `Choose your pathway. I have selected ${program} for now.`,
    "Add your basic details so the Admission Cell can contact you correctly.",
    "Tell us your current stage and your goal. One honest answer is enough.",
    "Review your application. After submission, your dashboard opens only after approval."
  ];
  return messages[step] ?? messages[0];
}

function HiddenApplicationFields({ selectedProgramSlug, referralId, values }: { selectedProgramSlug: string; referralId?: string; values: FormValues }) {
  return (
    <>
      <input type="hidden" name="programSlug" value={selectedProgramSlug} />
      <input type="hidden" name="referralId" value={referralId ?? ""} />
      {(Object.keys(values) as Array<keyof FormValues>).map((field) => (
        <input key={field} type="hidden" name={field} value={values[field]} />
      ))}
    </>
  );
}

function WelcomeStep({ selectedProgramTitle }: { selectedProgramTitle: string }) {
  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">Step 1</p>
      <h2 className="mt-3 text-4xl font-black uppercase leading-none text-black sm:text-5xl">Let&apos;s begin.</h2>
      <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-brand-muted">
        You are applying for review, not creating instant dashboard access. NEXA AI will guide you, and the Admission Cell will approve eligible students.
      </p>
      <div className="mt-8 rounded-lg bg-[#fbfaf7] p-6">
        <p className="text-sm font-black text-brand-muted">Current selected pathway</p>
        <p className="mt-2 text-2xl font-black text-black">{selectedProgramTitle}</p>
      </div>
    </section>
  );
}

function ProgramStep({ selectedProgramSlug, onSelect }: { selectedProgramSlug: string; onSelect: (slug: LaunchApplicationProgramSlug) => void }) {
  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">Step 2</p>
      <h2 className="mt-3 text-4xl font-black uppercase leading-none text-black sm:text-5xl">Choose program.</h2>
      <div className="mt-8 grid gap-4">
        {launchApplicationPrograms.map((program) => {
          const Icon = program.icon;
          const active = program.slug === selectedProgramSlug;
          return (
            <button
              key={program.slug}
              type="button"
              onClick={() => onSelect(program.slug)}
              className={`rounded-lg border p-5 text-left transition hover:-translate-y-1 hover:shadow-soft ${
                active ? "border-brand-red bg-white shadow-soft" : "border-black/8 bg-[#fbfaf7]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${active ? "bg-brand-red text-white" : "bg-white text-brand-red"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-black">{program.title}</h3>
                    <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black uppercase text-brand-dark">{program.feeLabel}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-brand-muted">{program.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BasicDetailsStep({ values, onChange }: { values: FormValues; onChange: (field: keyof FormValues, value: string) => void }) {
  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">Step 3</p>
      <h2 className="mt-3 text-4xl font-black uppercase leading-none text-black sm:text-5xl">Basic details.</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <TextInput label="Full Name" value={values.name} onChange={(value) => onChange("name", value)} autoComplete="name" required />
        <TextInput label="Phone" value={values.phone} onChange={(value) => onChange("phone", value)} autoComplete="tel" required />
        <TextInput label="WhatsApp Number" value={values.whatsapp} onChange={(value) => onChange("whatsapp", value)} autoComplete="tel" required />
        <TextInput label="Email" value={values.email} onChange={(value) => onChange("email", value)} type="email" autoComplete="email" />
        <TextInput label="City" value={values.city} onChange={(value) => onChange("city", value)} autoComplete="address-level2" required />
        <TextInput label="State" value={values.state} onChange={(value) => onChange("state", value)} autoComplete="address-level1" required />
      </div>
    </section>
  );
}

function GoalStep({ values, onChange }: { values: FormValues; onChange: (field: keyof FormValues, value: string) => void }) {
  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">Step 4</p>
      <h2 className="mt-3 text-4xl font-black uppercase leading-none text-black sm:text-5xl">Your goal.</h2>
      <div className="mt-8 grid gap-5">
        <Field label="Education / Work Status">
          <select value={values.educationOrWork} onChange={(event) => onChange("educationOrWork", event.target.value)} required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
            <option value="">Select current status</option>
            <option>School student</option>
            <option>College student</option>
            <option>Graduate</option>
            <option>Working professional</option>
            <option>Founder / business owner</option>
            <option>Looking for internship</option>
          </select>
        </Field>
        <Field label="Preferred Counselling Time">
          <select value={values.preferredCounsellingTime} onChange={(event) => onChange("preferredCounsellingTime", event.target.value)} required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
            <option value="">Select time</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
            <option>Weekend</option>
          </select>
        </Field>
        <Field label="Your Goal">
          <textarea
            value={values.goal}
            onChange={(event) => onChange("goal", event.target.value)}
            required
            rows={5}
            placeholder="Tell us what you want to build, learn, earn or improve."
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base font-semibold text-brand-dark placeholder:text-brand-muted/70 focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
          />
        </Field>
      </div>
    </section>
  );
}

function ReviewStep({ values, selectedProgramTitle }: { values: FormValues; selectedProgramTitle: string }) {
  const reviewRows = [
    ["Program", selectedProgramTitle],
    ["Name", values.name],
    ["WhatsApp", values.whatsapp],
    ["City", `${values.city}, ${values.state}`],
    ["Current Status", values.educationOrWork],
    ["Counselling", values.preferredCounsellingTime],
    ["Goal", values.goal]
  ];

  return (
    <section>
      <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">Step 5</p>
      <h2 className="mt-3 text-4xl font-black uppercase leading-none text-black sm:text-5xl">Review.</h2>
      <div className="mt-8 divide-y divide-black/8 overflow-hidden rounded-lg border border-black/8">
        {reviewRows.map(([label, value]) => (
          <div key={label} className="grid gap-2 bg-white p-4 sm:grid-cols-[180px_1fr]">
            <p className="text-sm font-black text-brand-muted">{label}</p>
            <p className="font-semibold leading-7 text-brand-dark">{value || "Not provided"}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-brand-muted">
        <MessageCircle className="h-4 w-4 text-brand-gold" />
        After submission, your application goes to the Admission Cell review queue.
      </p>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark placeholder:text-brand-muted/70 focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
      />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      {children}
    </label>
  );
}
