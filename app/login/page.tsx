import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Login"
};

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Continue your SkillCity learning journey with Tara AI.">
      <LoginForm />
    </AuthShell>
  );
}
