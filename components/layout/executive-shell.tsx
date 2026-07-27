import Link from "next/link";
import type React from "react";
import { BarChart3, Bot, BriefcaseBusiness, Building2, CreditCard, Gauge, HeartPulse, Landmark, Network, Settings, Sparkles, Users, Workflow, GraduationCap } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const nav = [
  { href: "/executive/dashboard", label: "Executive Dashboard", icon: Gauge },
  { href: "/executive/institution-health", label: "Institution Health", icon: HeartPulse },
  { href: "/executive/campuses", label: "Campuses", icon: Building2 },
  { href: "/executive/programs", label: "Programs", icon: GraduationCap },
  { href: "/executive/students", label: "Students", icon: Users },
  { href: "/executive/admissions", label: "Admissions", icon: BriefcaseBusiness },
  { href: "/executive/finance", label: "Finance", icon: CreditCard },
  { href: "/executive/hr", label: "HR", icon: Network },
  { href: "/executive/departments", label: "Departments", icon: Landmark },
  { href: "/executive/automation-center", label: "Automation Center", icon: Workflow },
  { href: "/executive/ai-command-center", label: "AI Command Center", icon: Bot },
  { href: "/executive/reports", label: "Reports", icon: BarChart3 },
  { href: "/executive/system-settings", label: "System Settings", icon: Settings }
];

export function ExecutiveShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-brand-dark">
      <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-black/5 bg-white px-5 py-6 xl:block">
        <Link href="/executive/dashboard"><Logo /></Link>
        <div className="mt-8 rounded-lg bg-brand-beige p-4"><div className="flex items-center gap-2 text-brand-red"><Sparkles className="h-5 w-5" /><p className="font-black">Executive OS</p></div></div>
        <nav className="mt-6 space-y-2">{nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}</nav>
      </aside>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-5 py-4 xl:hidden"><Link href="/executive/dashboard"><Logo /></Link><nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{nav.map((item) => <Link key={item.href} href={item.href} className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-brand-muted">{item.label}</Link>)}</nav></header>
      <main className="xl:pl-80"><div className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
