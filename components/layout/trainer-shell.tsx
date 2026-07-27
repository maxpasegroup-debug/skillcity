import Link from "next/link";
import type React from "react";
import { BarChart3, Bell, BookOpen, Bot, Calendar, CheckSquare, ClipboardCheck, FileText, Gauge, GraduationCap, Library, MessageSquare, Settings, Users } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const nav = [
  { href: "/trainer/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/trainer/my-batches", label: "My Batches", icon: GraduationCap },
  { href: "/trainer/todays-classes", label: "Today's Classes", icon: Calendar },
  { href: "/trainer/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/trainer/assignments", label: "Assignments", icon: CheckSquare },
  { href: "/trainer/submissions", label: "Submissions", icon: FileText },
  { href: "/trainer/reflections", label: "Reflections", icon: MessageSquare },
  { href: "/trainer/assessments", label: "Assessments", icon: BookOpen },
  { href: "/trainer/students", label: "Students", icon: Users },
  { href: "/trainer/calendar", label: "Calendar", icon: Calendar },
  { href: "/trainer/announcements", label: "Announcements", icon: Bell },
  { href: "/trainer/resources", label: "Resources", icon: Library },
  { href: "/trainer/reports", label: "Reports", icon: BarChart3 },
  { href: "/trainer/tara", label: "Tara", icon: Bot },
  { href: "/trainer/settings", label: "Settings", icon: Settings }
];

export function TrainerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-brand-dark">
      <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-black/5 bg-white px-5 py-6 xl:block">
        <Link href="/trainer/dashboard"><Logo /></Link>
        <nav className="mt-10 space-y-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red">
              <item.icon className="h-5 w-5" />{item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-5 py-4 xl:hidden">
        <Link href="/trainer/dashboard"><Logo /></Link>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {nav.map((item) => <Link key={item.href} href={item.href} className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-brand-muted">{item.label}</Link>)}
        </nav>
      </header>
      <main className="xl:pl-80"><div className="mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
