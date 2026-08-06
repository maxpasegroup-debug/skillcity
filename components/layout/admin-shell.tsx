import Link from "next/link";
import type React from "react";
import { Building2, CheckCircle2, FileText, Gauge, KeyRound, Settings, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const nav = [
  { href: "/admin/dashboard", label: "Command Center", icon: Gauge },
  { href: "/admin/admission-cell", label: "Admission Cell", icon: FileText },
  { href: "/admin/access", label: "Student Access", icon: KeyRound },
  { href: "/admissions/review", label: "Review", icon: CheckCircle2 },
  { href: "/admissions/payments", label: "Fee", icon: ShieldCheck },
  { href: "/admissions/programs", label: "Programs", icon: Building2 },
  { href: "/admissions/leads", label: "Leads", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-brand-dark">
      <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-black/5 bg-white px-5 py-6 xl:block">
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
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-5 py-4 backdrop-blur xl:hidden">
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
        <div className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
