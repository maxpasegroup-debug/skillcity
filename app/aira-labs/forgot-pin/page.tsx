import type { Metadata } from "next";
import { LabsPinRecoveryForm } from "@/features/aira-labs/components/labs-account-forms";
import { LabsAccountShell } from "@/features/aira-labs/components/labs-account-shell";

export const metadata: Metadata = { title: "Reset PIN | AIRA Labs" };
export default function LabsForgotPinPage() {
  return <LabsAccountShell title="Reset your PIN" subtitle="PIN recovery is permitted only with the short-lived OTP sent to your registered mobile number."><LabsPinRecoveryForm /></LabsAccountShell>;
}
