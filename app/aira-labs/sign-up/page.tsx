import type { Metadata } from "next";
import { LabsSignupForm } from "@/features/aira-labs/components/labs-account-forms";
import { LabsAccountShell } from "@/features/aira-labs/components/labs-account-shell";

export const metadata: Metadata = { title: "Create Account | AIRA Labs", description: "Create your AIRA Labs account for applications and enquiries." };

export default function LabsSignupPage() {
  return <LabsAccountShell title="Create your AIRA Labs account" subtitle="One mobile account for applications, enquiries, updates and future Labs services."><LabsSignupForm /></LabsAccountShell>;
}
