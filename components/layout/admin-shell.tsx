import Link from "next/link";
import type React from "react";
import { Building2, CheckCircle2, CreditCard, FileText, Gauge, GraduationCap, KeyRound, ListChecks, PhoneCall, Settings, ShieldCheck, UserCheck, Users } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/admissions/action-queue", label: "Action Required", icon: ListChecks },
  { href: "/admissions/leads", label: "CRM Leads", icon: Users },
  { href: "/telecaller", label: "Telecallers", icon: PhoneCall },
  { href: "/counsellor", label: "Counsellors", icon: UserCheck },
  { href: "/admissions/applications", label: "Applications", icon: FileText },
  { href: "/admissions/payments", label: "Payments", icon: CreditCard },
  { href: "/admissions/enrollments", label: "Students", icon: GraduationCap },
  { href: "/admissions/programs", label: "Programs", icon: Building2 },
  { href: "/director/batch-management", label: "Batches", icon: GraduationCap },
  { href: "/trainer/my-batches", label: "Trainers", icon: Users },
  { href: "/admin/users", label: "Users & Roles", icon: ShieldCheck },
  { href: "/admin/access", label: "Student Access", icon: KeyRound },
  { href: "/admissions/reports", label: "Reports", icon: CheckCircle2 },
  { href: "/admin/admission-cell", label: "Admission Cell", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-80 px-5 py-6 xl:block">
        <Link href="/admin/dashboard" aria-label="AIRA Skill City admin">
          <Logo />
        </Link>
        <nav className="mt-10 space-y-2" aria-label="Admin navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted transition hover:bg-brand-card hover:text-brand-red">
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <header className="skillcity-mobile-header sticky top-0 z-30 px-5 py-4 xl:hidden">
        <Link href="/admin/dashboard" aria-label="AIRA Skill City admin">
          <Logo />
        </Link>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Admin mobile navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-brand-muted">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="xl:pl-80">
        <div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
