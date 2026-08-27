"use client";

import type React from "react";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { submitPublicApplicationAction, publicApplicationInitialState } from "@/actions/public-application";
import { Button } from "@/components/ui/button";
import { launchApplicationPrograms, type LaunchApplicationProgramSlug } from "@/features/apply/programs";
import { NexaOrb } from "./nexa-orb";
import {
  CandidateStep,
  GoalsStep,
  HiddenApplicationFields,
  IntroStep,
  ProgramStep,
  ReviewStep,
  SubmittedStep,
  getProgramDisplay,
  initialApplicationValues,
  onboardingStates,
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
  const [currentState, setCurrentState] = useState<OnboardingState>("intro");
  const [programSelectedOnce, setProgramSelectedOnce] = useState(Boolean(initialProgramSlug));
  const [values, setValues] = useState<FormValues>(initialApplicationValues);
  const [clientMessage, setClientMessage] = useState("");
  const [state, action, pending] = useActionState(submitPublicApplicationAction, publicApplicationInitialState);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const currentIndex = onboardingStates.findIndex((step) => step.id === currentState);
  const selectedProgram = useMemo(
    () => launchApplicationPrograms.find((program) => program.slug === selectedProgramSlug) ?? launchApplicationPrograms[0],
    [selectedProgramSlug]
  );
  const selectedDisplay = getProgramDisplay(selectedProgramSlug);
  const progress = Math.round(((Math.max(currentIndex, 0) + 1) / onboardingStates.length) * 100);
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
    if (currentState === "intro") return true;
    if (currentState === "program") return programSelectedOnce;
    if (currentState === "candidate") return values.name.trim() && values.phone.trim() && values.whatsapp.trim() && values.city.trim() && values.state.trim();
    if (currentState === "goals") return values.educationOrWork.trim() && values.preferredCounsellingTime.trim() && values.goal.trim().length >= 10;
    return true;
  }

  function nextStep() {
    if (!canContinue()) {
      setClientMessage(currentState === "program" ? "Choose a path first." : "Share this bit so I can guide you forward.");
      return;
    }
    setClientMessage("");
    setCurrentState(onboardingStates[Math.min(currentIndex + 1, onboardingStates.length - 1)].id);
  }

  function previousStep() {
    setClientMessage("");
    setCurrentState(onboardingStates[Math.max(currentIndex - 1, 0)].id);
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

            <form action={action} className="flex min-h-[620px] flex-col bg-[#fbfaf7] lg:min-h-[720px]">
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
                {clientMessage || (state.message && !state.ok) ? (
                  <p className="mb-5 rounded-lg border border-brand-red/15 bg-brand-red/8 p-4 text-sm font-bold text-brand-red">{clientMessage || state.message}</p>
                ) : null}

                {state.ok ? <SubmittedStep applicationId={state.applicationId} message={state.message} /> : null}
                {!state.ok && currentState === "intro" ? <IntroStep /> : null}
                {!state.ok && currentState === "program" ? <ProgramStep selectedProgramSlug={selectedProgramSlug} selectedOnce={programSelectedOnce} onSelect={selectProgram} /> : null}
                {!state.ok && currentState === "candidate" ? <CandidateStep values={values} onChange={updateValue} /> : null}
                {!state.ok && currentState === "goals" ? <GoalsStep values={values} onChange={updateValue} /> : null}
                {!state.ok && currentState === "review" ? <ReviewStep values={values} selectedProgramSlug={selectedProgramSlug} /> : null}
              </div>

              {!state.ok ? (
                <footer className="border-t border-black/8 bg-white/72 px-5 py-4 backdrop-blur sm:px-8">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" variant="secondary" disabled={currentIndex === 0 || pending} onClick={previousStep} className="rounded-full">
                      <ArrowLeft className="h-5 w-5" />
                      Back
                    </Button>
                    {currentState === "review" ? (
                      <Button disabled={pending} className="h-14 rounded-full px-8">
                        {pending ? "Sending..." : "Send to Admission Cell"}
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    ) : (
                      <Button type="button" className="h-14 rounded-full px-8" onClick={nextStep}>
                        {currentState === "intro" ? "Begin" : "Continue"}
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
