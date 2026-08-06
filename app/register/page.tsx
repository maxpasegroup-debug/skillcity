import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Apply First"
};

export default function RegisterPage() {
  return (
    <AuthShell title="Apply before login" subtitle="Student dashboards open only after the Admission Cell approves your application and sends your WhatsApp PIN.">
      <div className="space-y-4">
        <Button asChild className="w-full" size="lg">
          <Link href="/apply">Apply Now</Link>
        </Button>
        <Button asChild className="w-full" size="lg" variant="secondary">
          <Link href="/application-status">Check Application Status</Link>
        </Button>
        <p className="text-center text-sm font-semibold leading-6 text-brand-muted">
          Staff accounts continue through the Login page.
        </p>
      </div>
    </AuthShell>
  );
}
