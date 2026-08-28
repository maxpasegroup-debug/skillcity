import Link from "next/link";
import type React from "react";
import { BarChart3, Bot, CalendarClock, CheckCircle2, CreditCard, FileCheck2, FileText, Gauge, GraduationCap, ListChecks, MessageSquare, Settings, Users, XCircle, BookOpen, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const nav = [
  { href: "/admissions/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/admissions/action-queue", label: "Action Queue", icon: ListChecks },
  { href: "/admissions/leads", label: "Leads", icon: Users },
  { href: "/admissions/applications", label: "Applications", icon: FileText },
  { href: "/admissions/review", label: "Review Queue", icon: CheckCircle2 },
  { href: "/admissions/approved", label: "Approved", icon: GraduationCap },
  { href: "/admissions/rejected", label: "Rejected", icon: XCircle },
  { href: "/admissions/programs", label: "Programs", icon: BookOpen },
  { href: "/admissions/documents", label: "Documents", icon: FileCheck2 },
  { href: "/admissions/payments", label: "Payments", icon: CreditCard },
  { href: "/admissions/enrollments", label: "Enrollments", icon: GraduationCap },
  { href: "/admissions/counselling", label: "Counselling", icon: CalendarClock },
  { href: "/admissions/communications", label: "Communications", icon: MessageSquare },
  { href: "/admissions/reports", label: "Reports", icon: BarChart3 },
  { href: "/admissions/tara", label: "Tara AI", icon: Bot },
  { href: "/admin/dashboard", label: "Admin Command", icon: ShieldCheck },
  { href: "/admissions/settings", label: "Settings", icon: Settings }
];

export function AdmissionsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-80 px-5 py-6 xl:block">
        <Link href="/admissions/dashboard"><Logo /></Link>
        <nav className="mt-10 space-y-2">{nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}</nav>
      </aside>
      <header className="skillcity-mobile-header sticky top-0 z-30 px-5 py-4 xl:hidden">
        <Link href="/admissions/dashboard"><Logo /></Link>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{nav.map((item) => <Link key={item.href} href={item.href} className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-brand-muted">{item.label}</Link>)}</nav>
      </header>
      <main className="xl:pl-80"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
