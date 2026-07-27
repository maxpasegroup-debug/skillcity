import Link from "next/link";
import type React from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardList,
  Gauge,
  GraduationCap,
  Layers3,
  Megaphone,
  Settings,
  Users,
  Workflow
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { href: "/director/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/director/programs", label: "Programs", icon: GraduationCap },
  { href: "/director/journey-planner", label: "Journey Planner", icon: Workflow },
  { href: "/director/learning-flows", label: "ALTT Flows", icon: Workflow },
  { href: "/director/blueprints", label: "Blueprints", icon: Layers3 },
  { href: "/director/batch-management", label: "Batch Management", icon: ClipboardList },
  { href: "/director/trainer-assignment", label: "Trainer Assignment", icon: Users },
  { href: "/director/communications", label: "Communications", icon: Megaphone },
  { href: "/director/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/director/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/director/tara", label: "Tara AI", icon: Bot },
  { href: "/director/settings", label: "Settings", icon: Settings }
];

export function DirectorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-brand-dark">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-80 border-r border-black/5 bg-white px-5 py-6 xl:block">
        <Link href="/director/dashboard" aria-label="SkillCity Director dashboard">
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
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-5 py-4 backdrop-blur xl:hidden">
        <Link href="/director/dashboard" aria-label="SkillCity Director dashboard">
          <Logo />
        </Link>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Director mobile navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-brand-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="xl:pl-80">
        <div className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
