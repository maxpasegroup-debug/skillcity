import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Register"
};

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start with one simple account. Your role is assigned by the SkillCity team.">
      <RegisterForm />
    </AuthShell>
  );
}
