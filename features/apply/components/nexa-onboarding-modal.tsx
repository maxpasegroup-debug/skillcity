"use client";

import type React from "react";
import { startTransition, useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { submitPublicApplicationAction, submitPublicEnquiryAction, publicApplicationInitialState } from "@/actions/public-application";
import { Button } from "@/components/ui/button";
import { launchApplicationPrograms, type LaunchApplicationProgramSlug } from "@/features/apply/programs";
import { NexaOrb } from "./nexa-orb";
import {
  CounsellingStep,
  DetailStep,
  EnquiryStep,
  HiddenApplicationFields,
  IntentStep,
  ProgramStep,
  ReviewStep,
  SubmittedStep,
  TalkToAdmissionsLink,
  enquiryWhatsAppUrl,
  getProgramDisplay,
  getProgressIndex,
  initialApplicationValues,
  type FormValues,
  type OnboardingState
} from "./nexa-onboarding-steps";

type NexaOnboardingModalProps = {
  open?: boolean;
  initialProgramSlug?: string;
  referralId?: string;
  onClose?: () => void;
  standalone?: boolean;
};

export function NexaOnboardingModal({ open = true, initialProgramSlug, referralId, onClose, standalone = false }: NexaOnboardingModalProps) {
  const firstProgram = launchApplicationPrograms.find((program) => program.slug === initialProgramSlug) ?? launchApplicationPrograms[0];
  const [selectedProgramSlug, setSelectedProgramSlug] = useState<LaunchApplicationProgramSlug>(firstProgram.slug);
  const [currentState, setCurrentState] = useState<OnboardingState>("intent");
  const [programSelectedOnce, setProgramSelectedOnce] = useState(Boolean(initialProgramSlug));
  const [values, setValues] = useState<FormValues>(initialApplicationValues);
  const [clientMessage, setClientMessage] = useState("");
  const [applicationState, applicationAction, applicationPending] = useActionState(submitPublicApplicationAction, publicApplicationInitialState);
  const [enquiryState, enquiryAction, enquiryPending] = useActionState(submitPublicEnquiryAction, publicApplicationInitialState);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const openedEnquiryWhatsAppRef = useRef(false);

  const progressIndex = getProgressIndex(currentState);
  const selectedProgram = useMemo(
    () => launchApplicationPrograms.find((program) => program.slug === selectedProgramSlug) ?? launchApplicationPrograms[0],
    [selectedProgramSlug]
  );
  const selectedDisplay = getProgramDisplay(selectedProgramSlug);
  const progress = Math.round(((progressIndex + 1) / 5) * 100);
  const pending = applicationPending || enquiryPending;
  const requestClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }

    if (standalone) {
      window.location.href = "/";
    }
  }, [onClose, standalone]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, requestClose]);

  useEffect(() => {
    if (!enquiryState.ok || openedEnquiryWhatsAppRef.current) return;
    openedEnquiryWhatsAppRef.current = true;
    window.open(enquiryWhatsAppUrl(selectedProgramSlug), "_blank", "noopener,noreferrer");
  }, [enquiryState.ok, selectedProgramSlug]);

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (clientMessage) setClientMessage("");
  }

  function selectProgram(slug: LaunchApplicationProgramSlug) {
    setSelectedProgramSlug(slug);
    setProgramSelectedOnce(true);
    setClientMessage("");
  }

  function canContinue() {
    if (currentState === "intent") return Boolean(values.intent);
    if (currentState === "program") return programSelectedOnce;
    if (currentState === "name") return values.name.trim().length >= 2;
    if (currentState === "whatsapp") return values.whatsapp.replace(/\D/g, "").length >= 7;
    if (currentState === "city") return values.city.trim().length >= 2;
    if (currentState === "email") return !values.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim());
    if (currentState === "counselling") return Boolean(values.counselled);
    return true;
  }

  function nextStep() {
    if (!canContinue()) {
      setClientMessage(getValidationMessage(currentState));
      return;
    }
    setClientMessage("");
    setCurrentState(getNextState(currentState, values.counselled));
  }

  function previousStep() {
    setClientMessage("");
    setCurrentState(getPreviousState(currentState));
  }

  function submitApplication() {
    if (!formRef.current) return;
    if (!canContinue()) {
      setClientMessage(getValidationMessage(currentState));
      return;
    }
    setClientMessage("");
    const formData = new FormData(formRef.current);
    startTransition(() => applicationAction(formData));
  }

  function submitEnquiry() {
    if (!formRef.current) return;
    setClientMessage("");
    const formData = new FormData(formRef.current);
    startTransition(() => enquiryAction(formData));
  }

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[90] ${standalone ? "bg-brand-dark" : ""}`} role="dialog" aria-modal="true" aria-labelledby="nexa-onboarding-title">
      <button type="button" className="absolute inset-0 cursor-default bg-black/72 backdrop-blur-xl" aria-label="Close Nexa onboarding" onClick={requestClose} />

      <div className="pointer-events-none fixed inset-0 overflow-y-auto px-3 py-4 sm:px-6 sm:py-8">
        <div className="flex min-h-full items-center justify-center">
          <div className="pointer-events-auto relative grid w-full max-w-[1500px] animate-[skillcity-modal-in_260ms_ease-out] overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#f8f4ea] shadow-[0_38px_130px_rgba(0,0,0,0.58)] lg:w-[88vw] lg:grid-cols-[0.86fr_1.14fr]">
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close onboarding"
              onClick={requestClose}
              className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur transition hover:bg-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold"
            >
              <X className="h-5 w-5" />
            </button>

            <aside className="relative min-h-[300px] overflow-hidden bg-brand-dark p-6 text-white sm:p-8 lg:min-h-[720px] lg:p-10">
              <div className="absolute inset-0 skillcity-dark-grid opacity-75" />
              <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(235,0,27,0.42),transparent_68%)]" />
              <div className="absolute bottom-0 left-0 h-72 w-72 bg-[radial-gradient(circle,rgba(198,155,67,0.22),transparent_70%)]" />

              <div className="relative z-10 flex h-full flex-col">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-brand-gold">AIRA Skill City</p>
                  <h2 className="mt-4 text-5xl font-black uppercase leading-none sm:text-6xl">NEXA</h2>
                  <p className="mt-3 max-w-xs text-base font-semibold leading-7 text-white/66">Your guide through Skill City.</p>
                </div>

                <div className="grid flex-1 place-items-center py-8">
                  <div className="relative">
                    <div className="absolute inset-[-54px] rounded-full bg-[radial-gradient(circle,rgba(235,0,27,0.22),transparent_68%)] blur-xl" />
                    <NexaOrb />
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/8 p-5 backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-gold">Selected path</p>
                  <p className="mt-2 text-2xl font-black">{programSelectedOnce ? selectedDisplay.label : "Waiting for you"}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/62">{programSelectedOnce ? selectedDisplay.line : "Choose what you want to build."}</p>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-brand-red transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </aside>

            <form ref={formRef} onSubmit={(event) => event.preventDefault()} className="flex min-h-[620px] flex-col bg-[#fbfaf7] lg:min-h-[720px]">
              <HiddenApplicationFields selectedProgramSlug={selectedProgram.slug} referralId={referralId} values={values} />

              <header className="border-b border-black/8 px-5 py-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-dark text-brand-gold">
                    <span className="text-sm font-black">NX</span>
                  </div>
                  <div>
                    <p id="nexa-onboarding-title" className="text-lg font-black text-brand-dark">Nexa</p>
                    <p className="text-sm font-bold text-brand-muted">AI Guide</p>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-7 sm:px-8 sm:py-9">
                {clientMessage || (applicationState.message && !applicationState.ok) || (enquiryState.message && !enquiryState.ok) ? (
                  <p className="mb-5 rounded-lg border border-brand-red/15 bg-brand-red/8 p-4 text-sm font-bold text-brand-red">{clientMessage || applicationState.message || enquiryState.message}</p>
                ) : null}

                {applicationState.ok ? <SubmittedStep programSlug={selectedProgramSlug} applicationId={applicationState.applicationId} message={applicationState.message} /> : null}
                {!applicationState.ok && currentState === "intent" ? <IntentStep selectedIntent={values.intent} onSelect={(intent) => updateValue("intent", intent)} /> : null}
                {!applicationState.ok && currentState === "program" ? <ProgramStep selectedProgramSlug={selectedProgramSlug} selectedOnce={programSelectedOnce} onSelect={selectProgram} /> : null}
                {!applicationState.ok && currentState === "name" ? <DetailStep question="What's your full name?" label="Full Name" value={values.name} onChange={(value) => updateValue("name", value)} autoComplete="name" /> : null}
                {!applicationState.ok && currentState === "whatsapp" ? <DetailStep question="What's the best WhatsApp number to reach you?" label="WhatsApp Number" value={values.whatsapp} onChange={(value) => updateValue("whatsapp", value)} autoComplete="tel" /> : null}
                {!applicationState.ok && currentState === "city" ? <DetailStep question="Which city are you from?" label="City" value={values.city} onChange={(value) => updateValue("city", value)} autoComplete="address-level2" /> : null}
                {!applicationState.ok && currentState === "email" ? <DetailStep question="What's your email?" label="Email" value={values.email} onChange={(value) => updateValue("email", value)} type="email" autoComplete="email" required={false} /> : null}
                {!applicationState.ok && currentState === "counselling" ? <CounsellingStep answer={values.counselled} onSelect={(answer) => updateValue("counselled", answer)} /> : null}
                {!applicationState.ok && currentState === "enquiry" ? <EnquiryStep programSlug={selectedProgramSlug} enquirySaved={enquiryState.ok} enquiryPending={enquiryPending} enquiryMessage={enquiryState.message} onSubmit={submitEnquiry} /> : null}
                {!applicationState.ok && currentState === "review" ? <ReviewStep values={values} selectedProgramSlug={selectedProgramSlug} /> : null}
              </div>

              {!applicationState.ok ? (
                <footer className="border-t border-black/8 bg-white/72 px-5 py-4 backdrop-blur sm:px-8">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                      <Button type="button" variant="secondary" disabled={currentState === "intent" || pending} onClick={previousStep} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                        Back
                      </Button>
                      <TalkToAdmissionsLink />
                    </div>
                    {currentState === "review" ? (
                      <Button type="button" onClick={submitApplication} disabled={pending} className="h-14 rounded-full px-8">
                        {pending ? "Sending..." : "Send to Admission Cell"}
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    ) : currentState === "enquiry" ? null : (
                      <Button type="button" className="h-14 rounded-full px-8" onClick={nextStep}>
                        Continue
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </footer>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function getNextState(currentState: OnboardingState, counselled: string): OnboardingState {
  if (currentState === "intent") return "program";
  if (currentState === "program") return "name";
  if (currentState === "name") return "whatsapp";
  if (currentState === "whatsapp") return "city";
  if (currentState === "city") return "email";
  if (currentState === "email") return "counselling";
  if (currentState === "counselling") return counselled === "NO" ? "enquiry" : "review";
  return currentState;
}

function getPreviousState(currentState: OnboardingState): OnboardingState {
  if (currentState === "program") return "intent";
  if (currentState === "name") return "program";
  if (currentState === "whatsapp") return "name";
  if (currentState === "city") return "whatsapp";
  if (currentState === "email") return "city";
  if (currentState === "counselling") return "email";
  if (currentState === "enquiry" || currentState === "review") return "counselling";
  return "intent";
}

function getValidationMessage(currentState: OnboardingState) {
  if (currentState === "intent") return "Choose what brings you here.";
  if (currentState === "program") return "Choose a path first.";
  if (currentState === "name") return "Enter your full name.";
  if (currentState === "whatsapp") return "Enter a valid WhatsApp number.";
  if (currentState === "city") return "Enter your city.";
  if (currentState === "email") return "Enter a valid email, or leave it blank.";
  if (currentState === "counselling") return "Choose whether you have spoken with Admissions.";
  return "Share this bit so I can guide you forward.";
}
