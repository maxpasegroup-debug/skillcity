"use client";

import Link from "next/link";
import type React from "react";
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, Code2, LineChart, MessageCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildAdmissionsWhatsAppUrl } from "@/config/admissions";
import { careerCategories } from "@/features/careers/catalog";
import { launchApplicationPrograms, type LaunchApplicationProgramSlug } from "@/features/apply/programs";

export type IntentId = "business" | "income" | "own" | "career" | "exploring";
export type CounsellingAnswer = "YES" | "NO" | "";

export type FormValues = {
  name: string;
  whatsapp: string;
  email: string;
  city: string;
  intent: IntentId | "";
  counselled: CounsellingAnswer;
};

export const initialApplicationValues: FormValues = {
  name: "",
  whatsapp: "",
  email: "",
  city: "",
  intent: "",
  counselled: ""
};

export type OnboardingState = "intent" | "career" | "program" | "name" | "whatsapp" | "city" | "email" | "counselling" | "enquiry" | "review";

export const progressStages = ["Welcome", "Your Path", "Your Details", "Counselling", "Application"] as const;

export function getProgressIndex(state: OnboardingState) {
  if (state === "intent") return 0;
  if (state === "career") return 1;
  if (state === "program") return 1;
  if (state === "name" || state === "whatsapp" || state === "city" || state === "email") return 2;
  if (state === "counselling" || state === "enquiry") return 3;
  return 4;
}

export const intentOptions = [
  {
    id: "business",
    number: "01",
    label: "I want to start a business",
    response: "Great. Let's find the path that fits your ambition. 🚀"
  },
  {
    id: "income",
    number: "02",
    label: "I want to turn my skills into income",
    response: "Perfect. Let's explore a path where your skills can become an income stream."
  },
  {
    id: "own",
    number: "03",
    label: "I want to build something of my own",
    response: "That's exactly what we're here for. Let's find your path."
  },
  {
    id: "career",
    number: "04",
    label: "I want to build my career",
    response: "Great. Let me show you the career opportunities at AIRA Skill City."
  },
  {
    id: "exploring",
    number: "05",
    label: "I'm exploring my options",
    response: "No problem. I'll help you understand the options first."
  }
] satisfies Array<{ id: IntentId; number: string; label: string; response: string }>;

const programCopy = {
  "startup-skool": {
    number: "01",
    label: "STARTUP SCHOOL",
    line: "Build your own business.",
    icon: Rocket
  },
  "genz-builder": {
    number: "02",
    label: "GENZ BUILDER",
    line: "Build with Vibe Coding.",
    icon: Code2
  },
  "nicejobs-sales-mastery": {
    number: "03",
    label: "SALES MASTERY",
    line: "Master the art of selling.",
    icon: LineChart
  }
} satisfies Record<LaunchApplicationProgramSlug, { number: string; label: string; line: string; icon: typeof Rocket }>;

export function getProgramDisplay(slug: LaunchApplicationProgramSlug) {
  return programCopy[slug];
}

export function getProgramTitle(slug: LaunchApplicationProgramSlug) {
  if (slug === "startup-skool") return "Startup School";
  if (slug === "genz-builder") return "GenZ Builder";
  return "Sales Mastery";
}

export function getIntentLabel(intent: IntentId | "") {
  return intentOptions.find((option) => option.id === intent)?.label ?? "";
}

export function applicationWhatsAppUrl(programSlug: LaunchApplicationProgramSlug) {
  return buildAdmissionsWhatsAppUrl(`Hi AIRA Skill City Admissions, I have submitted my application for ${getProgramTitle(programSlug)}. Please help me with the next step.`);
}

export function enquiryWhatsAppUrl(programSlug: LaunchApplicationProgramSlug) {
  return buildAdmissionsWhatsAppUrl(`Hi AIRA Skill City Admissions, I'm interested in ${getProgramTitle(programSlug)}. I'd like to know more about the program and speak with the Admissions Team.`);
}

export function generalAdmissionsWhatsAppUrl() {
  return buildAdmissionsWhatsAppUrl("Hi AIRA Skill City Admissions, I'd like to know more about the programs.");
}

export function HiddenApplicationFields({ selectedProgramSlug, referralId, values }: { selectedProgramSlug: string; referralId?: string; values: FormValues }) {
  return (
    <>
      <input type="hidden" name="programSlug" value={selectedProgramSlug} />
      <input type="hidden" name="referralId" value={referralId ?? ""} />
      <input type="hidden" name="name" value={values.name} />
      <input type="hidden" name="phone" value={values.whatsapp} />
      <input type="hidden" name="whatsapp" value={values.whatsapp} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="city" value={values.city} />
      <input type="hidden" name="state" value="" />
      <input type="hidden" name="educationOrWork" value="Counselling completed" />
      <input type="hidden" name="preferredCounsellingTime" value="Admissions follow-up" />
      <input type="hidden" name="goal" value={getIntentLabel(values.intent)} />
      <input type="hidden" name="intent" value={getIntentLabel(values.intent)} />
      <input type="hidden" name="counselled" value={values.counselled} />
    </>
  );
}

export function IntentStep({ selectedIntent, onSelect }: { selectedIntent: IntentId | ""; onSelect: (intent: IntentId) => void }) {
  const selected = intentOptions.find((option) => option.id === selectedIntent);

  return (
    <section>
      <div className="space-y-5">
        <NexaLine delay="delay-100">Hi, I&apos;m Nexa. 👋</NexaLine>
        <NexaLine delay="delay-300">I&apos;ll help you find the right path at AIRA Skill City.</NexaLine>
        <NexaLine>What brings you to AIRA Skill City?</NexaLine>
        {selected ? <NexaLine tone="warm">{selected.response}</NexaLine> : null}
      </div>

      <div className="mt-8 grid gap-3">
        {intentOptions.map((option) => {
          const active = option.id === selectedIntent;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`grid min-h-20 grid-cols-[auto_1fr] items-center gap-4 rounded-lg border p-4 text-left transition duration-300 hover:-translate-y-1 hover:border-brand-gold/70 hover:shadow-soft ${
                active ? "border-brand-red bg-brand-dark text-white shadow-[0_24px_70px_rgba(235,0,27,0.18)]" : "border-black/8 bg-white text-brand-dark"
              }`}
            >
              <span className={`text-sm font-black ${active ? "text-brand-gold" : "text-brand-red"}`}>{option.number}</span>
              <span className="text-lg font-black leading-tight">{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function ProgramStep({ selectedProgramSlug, selectedOnce, onSelect }: { selectedProgramSlug: LaunchApplicationProgramSlug; selectedOnce: boolean; onSelect: (slug: LaunchApplicationProgramSlug) => void }) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine>Which path feels right for you?</NexaLine>
        {selectedOnce ? <NexaLine tone="warm">Great choice. Let&apos;s get to know you a little.</NexaLine> : null}
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

export function CareerOpportunitiesStep() {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine tone="warm">Great. Let me show you the career opportunities at AIRA Skill City.</NexaLine>
        <NexaLine>Career opportunities</NexaLine>
      </div>

      <div className="mt-8 grid gap-3">
        {careerCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link key={category.slug} href="/careers" className="group grid min-h-24 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-black/8 bg-white p-4 text-left text-brand-dark transition hover:-translate-y-1 hover:border-brand-gold/70 hover:shadow-soft">
              <span className="text-sm font-black text-brand-red">{category.number}</span>
              <span>
                <span className="flex items-center gap-3 text-lg font-black leading-tight">
                  <Icon className="h-5 w-5 text-brand-red" />
                  {category.title}
                </span>
                <span className="mt-2 block text-sm font-semibold leading-6 text-brand-muted">{category.roles.map((role) => role.title).join(", ")}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-brand-red transition group-hover:translate-x-1" />
            </Link>
          );
        })}
      </div>

      <Button asChild className="mt-7 rounded-full" size="lg">
        <Link href="/careers">
          Open Careers
          <BriefcaseBusiness className="h-5 w-5" />
        </Link>
      </Button>
    </section>
  );
}

export function DetailStep({
  question,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = true
}: {
  question: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine tone="warm">No long form. Just the details our Admissions Team needs to contact you.</NexaLine>
        <NexaLine>{question}</NexaLine>
      </div>
      <div className="mt-9 max-w-xl">
        <TextInput label={label} value={value} onChange={onChange} type={type} autoComplete={autoComplete} required={required} />
      </div>
    </section>
  );
}

export function CounsellingStep({ answer, onSelect }: { answer: CounsellingAnswer; onSelect: (answer: CounsellingAnswer) => void }) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine>Have you already spoken with our Admissions Team?</NexaLine>
        {answer === "YES" ? <NexaLine tone="warm">Perfect. Let&apos;s complete your application.</NexaLine> : null}
        {answer === "NO" ? <NexaLine tone="warm">Let&apos;s get you connected first.</NexaLine> : null}
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ChoiceButton number="YES" title="Continue Application" active={answer === "YES"} onClick={() => onSelect("YES")} />
        <ChoiceButton number="NO" title="Talk to Admissions" active={answer === "NO"} onClick={() => onSelect("NO")} />
      </div>
    </section>
  );
}

export function EnquiryStep({
  programSlug,
  enquirySaved,
  enquiryPending,
  enquiryMessage,
  onSubmit
}: {
  programSlug: LaunchApplicationProgramSlug;
  enquirySaved: boolean;
  enquiryPending: boolean;
  enquiryMessage: string;
  onSubmit: () => void;
}) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine>Let&apos;s get you connected with our Admissions Team first.</NexaLine>
        <NexaLine tone="warm">They&apos;ll help you understand the program and answer your questions.</NexaLine>
      </div>
      {enquiryMessage ? <p className="mt-6 rounded-lg border border-brand-gold/25 bg-brand-gold/10 p-4 text-sm font-bold text-brand-dark">{enquiryMessage}</p> : null}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {enquirySaved ? (
          <Button asChild className="h-14 rounded-full px-8">
            <a href={enquiryWhatsAppUrl(programSlug)} target="_blank" rel="noreferrer">
              Talk to Admissions on WhatsApp
              <MessageCircle className="h-5 w-5" />
            </a>
          </Button>
        ) : (
          <Button type="button" onClick={onSubmit} disabled={enquiryPending} className="h-14 rounded-full px-8">
            {enquiryPending ? "Saving..." : "Talk to Admissions on WhatsApp"}
            <MessageCircle className="h-5 w-5" />
          </Button>
        )}
      </div>
    </section>
  );
}

export function ReviewStep({ values, selectedProgramSlug }: { values: FormValues; selectedProgramSlug: LaunchApplicationProgramSlug }) {
  const reviewRows = [
    ["Selected program", getProgramDisplay(selectedProgramSlug).label],
    ["Status", "Application Received"],
    ["Name", values.name],
    ["WhatsApp", values.whatsapp],
    ["City", values.city],
    ["Email", values.email || "Not provided"],
    ["What brings you here", getIntentLabel(values.intent)]
  ];

  return (
    <section>
      <div className="space-y-5">
        <NexaLine tone="warm">Perfect. Let&apos;s complete your application.</NexaLine>
        <NexaLine>I&apos;ll send this to the Admissions Team for review.</NexaLine>
      </div>
      <div className="mt-8 overflow-hidden rounded-lg border border-black/8 bg-white">
        {reviewRows.map(([label, value]) => (
          <div key={label} className="grid gap-2 border-b border-black/8 p-4 last:border-b-0 sm:grid-cols-[170px_1fr]">
            <p className="text-sm font-black text-brand-muted">{label}</p>
            <p className="font-semibold leading-7 text-brand-dark">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SubmittedStep({ programSlug, applicationId, message }: { programSlug: LaunchApplicationProgramSlug; applicationId?: string; message: string }) {
  return (
    <section className="grid min-h-[520px] place-items-center p-6 text-center sm:p-8">
      <div className="max-w-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red text-white shadow-[0_20px_54px_rgba(235,0,27,0.24)]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-brand-gold">Application received.</p>
        <h2 className="mt-3 text-4xl font-black leading-none text-brand-dark sm:text-5xl">Application received. ✓</h2>
        <p className="mt-5 text-lg font-semibold leading-8 text-brand-muted">{message}</p>
        <div className="mx-auto mt-7 max-w-md overflow-hidden rounded-lg border border-black/8 bg-white text-left">
          <SummaryRow label="Selected program" value={getProgramDisplay(programSlug).label} />
          <SummaryRow label="Status" value="Application Received" />
          <SummaryRow label="Next step" value="Admissions Team will contact you." />
          {applicationId ? <SummaryRow label="Application ID" value={applicationId} /> : null}
        </div>
        <Button asChild className="mt-7 rounded-full" size="lg">
          <a href={applicationWhatsAppUrl(programSlug)} target="_blank" rel="noreferrer">
            Chat with Admissions on WhatsApp
            <MessageCircle className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </section>
  );
}

export function TalkToAdmissionsLink() {
  return (
    <a href={generalAdmissionsWhatsAppUrl()} target="_blank" rel="noreferrer" className="text-sm font-black text-brand-muted underline decoration-brand-gold/60 underline-offset-4 transition hover:text-brand-red">
      Just want to know more? Talk to Admissions
    </a>
  );
}

function ChoiceButton({ number, title, active, onClick }: { number: string; title: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-28 rounded-lg border p-5 text-left transition hover:-translate-y-1 hover:border-brand-gold/70 hover:shadow-soft ${
        active ? "border-brand-red bg-brand-dark text-white shadow-[0_24px_70px_rgba(235,0,27,0.18)]" : "border-black/8 bg-white text-brand-dark"
      }`}
    >
      <span className={`text-sm font-black ${active ? "text-brand-gold" : "text-brand-red"}`}>{number}</span>
      <span className="mt-3 block text-xl font-black">{title}</span>
    </button>
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

function TextInput({ label, value, onChange, type = "text", autoComplete, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; required?: boolean }) {
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
        className="h-14 w-full rounded-lg border border-black/10 bg-white px-4 text-lg font-semibold text-brand-dark placeholder:text-brand-muted/65 focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-black/8 p-4 last:border-b-0">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red">{label}</p>
      <p className="mt-1 break-words font-semibold leading-6 text-brand-dark">{value}</p>
    </div>
  );
}
