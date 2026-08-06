import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login"
};

export default function LoginPage() {
  return (
    <AuthShell title="Enter with your approved PIN" subtitle="Students receive WhatsApp login access only after Admission Cell approval.">
      <LoginForm />
    </AuthShell>
  );
}
