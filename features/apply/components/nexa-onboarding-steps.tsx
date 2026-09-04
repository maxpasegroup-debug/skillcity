"use client";

import Link from "next/link";
import type React from "react";
import { ArrowRight, Bot, BrainCircuit, CheckCircle2, Clock3, Lock, MessageCircle, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildAdmissionsWhatsAppUrl } from "@/config/admissions";
import { careerCategories, isCareerRoleOpen } from "@/features/careers/catalog";
import { nexaProgramOptions, type LaunchApplicationProgramSlug } from "@/features/apply/programs";

export type IntentId = "startup-skool" | "aira-labs" | "career";
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

export type OnboardingState = "name" | "explore" | "career" | "program" | "whatsapp" | "city" | "email" | "counselling" | "enquiry" | "review";

export const progressStages = ["Welcome", "Your Path", "Your Details", "Counselling", "Application"] as const;

export function getProgressIndex(state: OnboardingState) {
  if (state === "name" || state === "explore") return 0;
  if (state === "career") return 1;
  if (state === "program") return 1;
  if (state === "whatsapp" || state === "city" || state === "email") return 2;
  if (state === "counselling" || state === "enquiry") return 3;
  return 4;
}

export const intentOptions = [
  {
    id: "startup-skool",
    number: "01",
    label: "Startup Skool",
    response: "A 180-day builder path for creating your own brand or business."
  },
  {
    id: "aira-labs",
    number: "02",
    label: "AIRA Labs",
    response: "A selective AI Product Engineering pathway with interview-based admission."
  },
  {
    id: "career",
    number: "03",
    label: "Career Hub",
    response: "Great. Let me show you the career opportunities at AIRA Skill City."
  }
] satisfies Array<{ id: IntentId; number: string; label: string; response: string }>;

const programCopy = {
  "startup-skool": {
    number: "01",
    label: "STARTUP SKOOL",
    line: "Build your own brand in 180 days.",
    icon: Rocket
  },
  "aira-labs": {
    number: "02",
    label: "AIRA LABS",
    line: "AI Product Engineering, by selection.",
    icon: BrainCircuit
  },
  "genz-builder": {
    number: "03",
    label: "GENZ BUILDER",
    line: "Build with Vibe Coding.",
    icon: Bot
  },
  "nicejobs-sales-mastery": {
    number: "04",
    label: "SALES MASTERY",
    line: "Master the art of selling.",
    icon: Rocket
  }
} satisfies Record<LaunchApplicationProgramSlug, { number: string; label: string; line: string; icon: typeof Rocket }>;

export function getProgramDisplay(slug: LaunchApplicationProgramSlug) {
  return programCopy[slug];
}

export function getProgramTitle(slug: LaunchApplicationProgramSlug) {
  if (slug === "startup-skool") return "Startup School";
  if (slug === "aira-labs") return "AIRA Labs";
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

export function HiddenApplicationFields({ selectedProgramSlug, referralId, values }: { selectedProgramSlug: LaunchApplicationProgramSlug; referralId?: string; values: FormValues }) {
  const intentLabel = getIntentLabel(values.intent) || getProgramDisplay(selectedProgramSlug).label;

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
      <input type="hidden" name="goal" value={intentLabel} />
      <input type="hidden" name="intent" value={intentLabel} />
      <input type="hidden" name="counselled" value={values.counselled} />
    </>
  );
}

export function IntentStep({ selectedIntent, onSelect }: { selectedIntent: IntentId | ""; onSelect: (intent: IntentId) => void }) {
  const selected = intentOptions.find((option) => option.id === selectedIntent);

  return (
    <section>
      <div className="space-y-5">
        <NexaLine tone="warm">Nice to meet you. What would you like to explore?</NexaLine>
        {selected ? <NexaLine tone="warm">{selected.response}</NexaLine> : null}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {intentOptions.map((option) => {
          const active = option.id === selectedIntent;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`inline-flex min-h-14 items-center gap-3 rounded-full border px-5 py-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-brand-gold/70 hover:shadow-soft ${
                active ? "border-brand-red bg-brand-dark text-white shadow-[0_24px_70px_rgba(235,0,27,0.18)]" : "border-black/8 bg-white text-brand-dark"
              }`}
            >
              <span className={`text-sm font-black ${active ? "text-brand-gold" : "text-brand-red"}`}>{option.number}</span>
              <span className="text-base font-black leading-tight">{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function NameStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine delay="delay-100">Hi, I&apos;m Nexa.</NexaLine>
        <NexaLine delay="delay-300">I&apos;ll help you find the right path at AIRA Skill City.</NexaLine>
        <NexaLine>What should I call you?</NexaLine>
      </div>
      <UserReplyInput label="Your Name" placeholder="Type your name..." value={value} onChange={onChange} autoComplete="name" required />
    </section>
  );
}
export function ProgramStep({ selectedProgramSlug, selectedOnce, onSelect }: { selectedProgramSlug: LaunchApplicationProgramSlug; selectedOnce: boolean; onSelect: (slug: LaunchApplicationProgramSlug) => void }) {
  return (
    <section>
      <div className="space-y-5">
        <NexaLine>Perfect. I&apos;ll open the right application path for you.</NexaLine>
        {selectedOnce ? <NexaLine tone="warm">Great choice. Let&apos;s get to know you a little.</NexaLine> : null}
      </div>

      <div className="mt-8 grid gap-3">
        {nexaProgramOptions.map((program) => {
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
        <NexaLine tone="warm">Great. I&apos;ll keep this inside our chat.</NexaLine>
        <NexaLine>Here are the vacancy categories. Only open positions are active right now.</NexaLine>
      </div>

      <div className="mt-8 grid gap-4">
        {careerCategories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.slug} className="rounded-2xl border border-black/8 bg-white p-4 shadow-[0_18px_46px_rgba(16,16,20,0.06)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-red/10 text-brand-red">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red">Category {category.number}</p>
                  <h3 className="text-lg font-black text-brand-dark">{category.title}</h3>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.roles.map((role) => {
                  const active = isCareerRoleOpen(role.slug);
                  const content = (
                    <>
                      <span>{role.title}</span>
                      {active ? <ArrowRight className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </>
                  );

                  return active ? (
                    <Link key={role.slug} href={`/careers/${role.slug}/apply`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-4 py-2 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-brand-red">
                      {content}
                    </Link>
                  ) : (
                    <span key={role.slug} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/8 bg-brand-beige/70 px-4 py-2 text-sm font-black text-brand-muted">
                      {content}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-2xl bg-brand-gold/10 px-4 py-3 text-sm font-bold text-brand-muted">
        <Clock3 className="h-4 w-4 shrink-0 text-brand-gold" />
        More vacancies will open in later hiring rounds.
      </div>
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
      <UserReplyInput label={label} placeholder={`Type ${label.toLowerCase()}...`} value={value} onChange={onChange} type={type} autoComplete={autoComplete} required={required} />
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
    <div className={`skillcity-nexa-say ${delay} flex items-start gap-3`}>
      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-dark text-[10px] font-black text-brand-gold">NX</div>
      <div className={`max-w-[760px] rounded-[1.4rem] rounded-tl-sm px-5 py-4 shadow-[0_14px_40px_rgba(16,16,20,0.07)] ${tone === "warm" ? "bg-brand-gold/14 text-brand-dark ring-1 ring-brand-gold/25" : "bg-white text-brand-dark ring-1 ring-black/8"}`}>
        <p className="text-lg font-semibold leading-8">{children}</p>
      </div>
    </div>
  );
}

function UserReplyInput({ label, placeholder, value, onChange, type = "text", autoComplete, required = false }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; required?: boolean }) {
  const id = `nexa-${label.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="mt-8 flex justify-end">
      <label className="block w-full max-w-xl rounded-[1.4rem] rounded-tr-sm bg-brand-dark p-3 shadow-[0_18px_48px_rgba(16,16,20,0.16)]" htmlFor={id}>
        <span className="sr-only">{label}</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className="h-12 w-full rounded-full border border-white/10 bg-white px-5 text-base font-semibold text-brand-dark placeholder:text-brand-muted/65 focus:border-brand-gold focus:outline-none focus:ring-4 focus:ring-brand-gold/20"
        />
      </label>
    </div>
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
