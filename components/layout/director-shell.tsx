import Link from "next/link";
import type React from "react";
import {
  BarChart3,
  Bot,
  Boxes,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  GraduationCap,
  Layers3,
  Megaphone,
  Scale,
  Settings,
  UserCheck,
  Users,
  Workflow
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";

const navigation = [
  { href: "/director/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/workspace", label: "My Workspaces", icon: Gauge },
  { href: "/director/programs", label: "Programs", icon: GraduationCap },
  { href: "/director/journey-planner", label: "Journey Planner", icon: Workflow },
  { href: "/director/learning-flows", label: "ALTT Flows", icon: Workflow },
  { href: "/director/blueprints", label: "Blueprints", icon: Layers3 },
  { href: "/director/batch-management", label: "Batch Management", icon: ClipboardList },
  { href: "/director/trainer-assignment", label: "Trainer Assignment", icon: Users },
  { href: "/director/advisor-assignments", label: "Advisor Assignment", icon: UserCheck },
  { href: "/labs", label: "AIRA Labs", icon: Boxes },
  { href: "/skill-studio", label: "Skill Studio", icon: BookOpen },
  { href: "/career", label: "Career Hub", icon: BriefcaseBusiness },
  { href: "/documents", label: "Core Documents", icon: FileText },
  { href: "/compliance", label: "Compliance", icon: Scale },
  { href: "/director/communications", label: "Communications", icon: Megaphone },
  { href: "/communications/channels", label: "Team Channels", icon: Megaphone },
  { href: "/director/careers", label: "Careers", icon: BriefcaseBusiness },
  { href: "/director/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/director/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/sia", label: "SIA Operating Centre", icon: Bot },
  { href: "/director/tara", label: "SIA Assistant", icon: Bot },
  { href: "/director/settings", label: "Settings", icon: Settings }
];

export function DirectorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 z-40 hidden w-80 px-5 py-6 xl:block">
        <Link href="/director/dashboard" aria-label="Skill City Director dashboard">
          <Logo />
        </Link>
        <nav className="mt-10 space-y-2" aria-label="Director navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-bold text-brand-muted transition hover:bg-brand-card hover:text-brand-red"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <MobileAppNavigation homeHref="/director/dashboard" navigation={navigation.map(({ href, label }) => ({ href, label }))} label="Director workspace" />
      <main className="xl:pl-80">
        <div className="skillcity-shell-content mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
