"use client";

import type React from "react";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Code2, LineChart, MessageCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { launchApplicationPrograms, type LaunchApplicationProgramSlug } from "@/features/apply/programs";

export type FormValues = {
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

export const initialApplicationValues: FormValues = {
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

export type OnboardingState = "intro" | "program" | "candidate" | "goals" | "review";

export const onboardingStates: Array<{ id: OnboardingState; label: string }> = [
  { id: "intro", label: "Nexa intro" },
  { id: "program", label: "Path" },
  { id: "candidate", label: "You" },
  { id: "goals", label: "Goal" },
  { id: "review", label: "Handoff" }
];

const programCopy = {
  "startup-skool": {
    number: "01",
    label: "STARTUP SKOOL",
    line: "Build your own business.",
    icon: Rocket,
    response: "Great choice. 🚀",
    followUp: "You are looking to build something of your own."
  },
  "genz-builder": {
    number: "02",
    label: "GENZ BUILDER",
    line: "Build with Vibe Coding.",
    icon: Code2,
    response: "Nice. You want to create with AI.",
    followUp: "Let us understand what kind of builder you want to become."
  },
  "nicejobs-sales-mastery": {
    number: "03",
    label: "SALES MASTERY",
    line: "Master the art of selling.",
    icon: LineChart,
    response: "Strong path. Sales is a real career advantage.",
    followUp: "I will help the Admission Cell understand your intent clearly."
  }
} satisfies Record<LaunchApplicationProgramSlug, { number: string; label: string; line: string; icon: typeof Rocket; response: string; followUp: string }>;

export function getProgramDisplay(slug: LaunchApplicationProgramSlug) {
  return programCopy[slug];
}

export function HiddenApplicationFields({ selectedProgramSlug, referralId, values }: { selectedProgramSlug: string; referralId?: string; values: FormValues }) {
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

export function IntroStep() {
  return (
    <section className="space-y-8">
      <NexaLine delay="delay-100">Hi, I&apos;m Nexa. 👋</NexaLine>
      <NexaLine delay="delay-300">I&apos;ll help you find the right path at AIRA Skill City.</NexaLine>
      <div className="pt-3">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-brand-red">First question</p>
        <h2 className="mt-3 text-4xl font-black leading-none text-brand-dark sm:text-5xl">What are you looking to build?</h2>
      </div>
    </section>
  );
}

export function ProgramStep({
  selectedProgramSlug,
  selectedOnce,
  onSelect
}: {
  selectedProgramSlug: LaunchApplicationProgramSlug;
  selectedOnce: boolean;
  onSelect: (slug: LaunchApplicationProgramSlug) => void;
}) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine>Which path feels right for you?</NexaLine>
        {selectedOnce ? (
          <NexaLine tone="warm">
            {programCopy[selectedProgramSlug].response}
            <br />
            {programCopy[selectedProgramSlug].followUp}
          </NexaLine>
        ) : null}
      </div>

      <div className="mt-8 grid gap-3">
        {launchApplicationPrograms.map((program) => {
          const display = programCopy[program.slug];
          const Icon = display.icon;
          const active = program.slug === selectedProgramSlug;
          const dimmed = selectedOnce && !active;

          return (
            <button
              key={program.slug}
              type="button"
              onClick={() => onSelect(program.slug)}
              className={`group grid min-h-28 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border p-4 text-left transition duration-300 sm:p-5 ${
                active && selectedOnce
                  ? "border-brand-red bg-brand-dark text-white shadow-[0_24px_70px_rgba(235,0,27,0.18)]"
                  : "border-black/8 bg-white text-brand-dark hover:-translate-y-1 hover:border-brand-gold/70 hover:shadow-soft"
              } ${dimmed ? "scale-[0.985] opacity-45" : "opacity-100"}`}
            >
              <span className={`text-sm font-black ${active && selectedOnce ? "text-brand-gold" : "text-brand-red"}`}>{display.number}</span>
              <span>
                <span className="flex items-center gap-3 text-xl font-black leading-tight">
                  <Icon className={`h-5 w-5 ${active && selectedOnce ? "text-brand-gold" : "text-brand-red"}`} />
                  {display.label}
                </span>
                <span className={`mt-2 block text-base font-semibold ${active && selectedOnce ? "text-white/72" : "text-brand-muted"}`}>{display.line}</span>
              </span>
              <ArrowRight className={`h-5 w-5 transition group-hover:translate-x-1 ${active && selectedOnce ? "text-brand-gold" : "text-brand-red"}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CandidateStep({ values, onChange }: { values: FormValues; onChange: (field: keyof FormValues, value: string) => void }) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine tone="warm">Let&apos;s get to know you a little.</NexaLine>
        <NexaLine>No long form. Just the details the Admission Cell needs to call you correctly.</NexaLine>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <TextInput label="Full name" value={values.name} onChange={(value) => onChange("name", value)} autoComplete="name" required />
        <TextInput label="Phone" value={values.phone} onChange={(value) => onChange("phone", value)} autoComplete="tel" required />
        <TextInput label="WhatsApp" value={values.whatsapp} onChange={(value) => onChange("whatsapp", value)} autoComplete="tel" required />
        <TextInput label="Email" value={values.email} onChange={(value) => onChange("email", value)} type="email" autoComplete="email" />
        <TextInput label="City" value={values.city} onChange={(value) => onChange("city", value)} autoComplete="address-level2" required />
        <TextInput label="State" value={values.state} onChange={(value) => onChange("state", value)} autoComplete="address-level1" required />
      </div>
    </section>
  );
}

export function GoalsStep({ values, onChange }: { values: FormValues; onChange: (field: keyof FormValues, value: string) => void }) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine>What brings you to Skill City today?</NexaLine>
        <NexaLine tone="warm">Say it simply. I&apos;ll carry the right context forward.</NexaLine>
      </div>
      <div className="mt-8 grid gap-4">
        <Field label="What are you doing now?">
          <select value={values.educationOrWork} onChange={(event) => onChange("educationOrWork", event.target.value)} required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
            <option value="">Choose one</option>
            <option>School student</option>
            <option>College student</option>
            <option>Graduate</option>
            <option>Working professional</option>
            <option>Founder / business owner</option>
            <option>Looking for internship</option>
          </select>
        </Field>
        <Field label="Best time for counselling">
          <select value={values.preferredCounsellingTime} onChange={(event) => onChange("preferredCounsellingTime", event.target.value)} required className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
            <option value="">Choose a time</option>
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Evening</option>
            <option>Weekend</option>
          </select>
        </Field>
        <Field label="Your goal">
          <textarea
            value={values.goal}
            onChange={(event) => onChange("goal", event.target.value)}
            required
            rows={4}
            placeholder="I want to..."
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base font-semibold text-brand-dark placeholder:text-brand-muted/65 focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
          />
        </Field>
      </div>
    </section>
  );
}

export function ReviewStep({ values, selectedProgramSlug }: { values: FormValues; selectedProgramSlug: LaunchApplicationProgramSlug }) {
  const selectedProgram = launchApplicationPrograms.find((program) => program.slug === selectedProgramSlug) ?? launchApplicationPrograms[0];
  const reviewRows = [
    ["Path", programCopy[selectedProgramSlug].label],
    ["Name", values.name],
    ["WhatsApp", values.whatsapp],
    ["Location", `${values.city}, ${values.state}`],
    ["Current stage", values.educationOrWork],
    ["Counselling", values.preferredCounsellingTime],
    ["Goal", values.goal]
  ];

  return (
    <section>
      <div className="space-y-5">
        <NexaLine tone="warm">Looks good.</NexaLine>
        <NexaLine>I&apos;ll send this to the Admission Cell for review.</NexaLine>
      </div>
      <div className="mt-8 overflow-hidden rounded-lg border border-black/8 bg-white">
        {reviewRows.map(([label, value]) => (
          <div key={label} className="grid gap-2 border-b border-black/8 p-4 last:border-b-0 sm:grid-cols-[150px_1fr]">
            <p className="text-sm font-black text-brand-muted">{label}</p>
            <p className="font-semibold leading-7 text-brand-dark">{value || "Not provided"}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 flex items-start gap-2 text-sm font-semibold leading-6 text-brand-muted">
        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
        After submission, the team reviews your {selectedProgram.shortTitle} application and contacts you for counselling.
      </p>
    </section>
  );
}

export function SubmittedStep({ applicationId, message }: { applicationId?: string; message: string }) {
  return (
    <section className="grid min-h-[520px] place-items-center p-6 text-center sm:p-8">
      <div className="max-w-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red text-white shadow-[0_20px_54px_rgba(235,0,27,0.24)]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-brand-gold">Application submitted</p>
        <h2 className="mt-3 text-4xl font-black leading-none text-brand-dark sm:text-5xl">Nexa sent it for review.</h2>
        <p className="mt-5 text-lg font-semibold leading-8 text-brand-muted">{message}</p>
        {applicationId ? (
          <div className="mx-auto mt-7 max-w-md rounded-lg border border-black/8 bg-brand-card p-4 text-left">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red">Application ID</p>
            <p className="mt-2 break-all text-sm font-semibold text-brand-muted">{applicationId}</p>
          </div>
        ) : null}
        <Button asChild className="mt-7 rounded-full" size="lg" variant="secondary">
          <Link href="/application-status">Check Status Later</Link>
        </Button>
      </div>
    </section>
  );
}

function NexaLine({ children, tone = "plain", delay = "" }: { children: React.ReactNode; tone?: "plain" | "warm"; delay?: string }) {
  return (
    <div className={`skillcity-nexa-say ${delay} rounded-lg border px-5 py-4 ${tone === "warm" ? "border-brand-gold/35 bg-brand-gold/10 text-brand-dark" : "border-black/8 bg-white text-brand-dark"}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-brand-red">
        <Bot className="h-4 w-4" />
        Nexa
      </div>
      <p className="text-xl font-semibold leading-8">{children}</p>
    </div>
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
  const id = `nexa-${label.toLowerCase().replaceAll(" ", "-")}`;
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
        className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark placeholder:text-brand-muted/65 focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
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
