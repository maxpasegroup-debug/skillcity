import type { Metadata } from "next";
import { LabsSigninForm } from "@/features/aira-labs/components/labs-account-forms";
import { LabsAccountShell } from "@/features/aira-labs/components/labs-account-shell";

export const metadata: Metadata = { title: "Sign In | AIRA Labs", description: "Sign in to your AIRA Labs account or authorized role workspace." };

export default function LabsSigninPage() {
  return <LabsAccountShell title="Sign in to AIRA Labs" subtitle="Use your mobile number and private six-digit PIN. Authorized employees are routed to their assigned dashboard."><LabsSigninForm /></LabsAccountShell>;
}
