import Link from "next/link";
import type React from "react";
import { BarChart3, Bot, Boxes, BriefcaseBusiness, Building2, CreditCard, FileText, Gauge, HeartPulse, Landmark, MessageSquareText, Network, Scale, Settings, ShieldCheck, Sparkles, Users, Workflow, GraduationCap } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";

const nav = [
  { href: "/executive/dashboard", label: "Executive Dashboard", icon: Gauge },
  { href: "/executive/institution-health", label: "Institution Health", icon: HeartPulse },
  { href: "/executive/campuses", label: "Campuses", icon: Building2 },
  { href: "/executive/programs", label: "Programs", icon: GraduationCap },
  { href: "/executive/students", label: "Students", icon: Users },
  { href: "/executive/admissions", label: "Admissions", icon: BriefcaseBusiness },
  { href: "/executive/finance", label: "Finance", icon: CreditCard },
  { href: "/documents", label: "Core Documents", icon: FileText },
  { href: "/compliance", label: "Compliance", icon: Scale },
  { href: "/finance", label: "Core Finance", icon: Landmark },
  { href: "/executive/hr", label: "HR / Recruitment", icon: Network },
  { href: "/employees", label: "Employee Directory", icon: Users },
  { href: "/labs", label: "AIRA Labs", icon: Boxes },
  { href: "/executive/departments", label: "Departments", icon: Landmark },
  { href: "/executive/automation-center", label: "Automation Center", icon: Workflow },
  { href: "/communications", label: "Communications", icon: MessageSquareText },
  { href: "/executive/ai-command-center", label: "AI Command Center", icon: Bot },
  { href: "/ai", label: "AI Governance", icon: ShieldCheck },
  { href: "/executive/reports", label: "Reports", icon: BarChart3 },
  { href: "/executive/system-settings", label: "System Settings", icon: Settings }
];

export function ExecutiveShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-80 px-5 py-6 xl:block">
        <Link href="/executive/dashboard"><Logo /></Link>
        <div className="mt-8 rounded-lg bg-brand-beige p-4"><div className="flex items-center gap-2 text-brand-red"><Sparkles className="h-5 w-5" /><p className="font-black">Executive OS</p></div></div>
        <nav className="mt-6 space-y-2">{nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}</nav>
      </aside>
      <MobileAppNavigation homeHref="/executive/dashboard" navigation={nav.map(({ href, label }) => ({ href, label }))} label="Executive workspace" />
      <main className="xl:pl-80"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
