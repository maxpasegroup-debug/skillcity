"use client";

import { NexaOnboardingModal } from "./nexa-onboarding-modal";

export function PublicApplicationForm({ initialProgramSlug, referralId }: { initialProgramSlug?: string; referralId?: string }) {
  return <NexaOnboardingModal open initialProgramSlug={initialProgramSlug} referralId={referralId} standalone />;
}
