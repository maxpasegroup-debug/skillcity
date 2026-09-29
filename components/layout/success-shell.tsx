import Link from "next/link";
import type React from "react";
import { Award, BadgeCheck, Briefcase, FileText, FolderGit2, GraduationCap, Home, Lightbulb, Medal, Settings, Sparkles, UserRound } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";

const nav = [
  { href: "/success/dashboard", label: "Dashboard", icon: Home },
  { href: "/success/portfolio", label: "Portfolio", icon: UserRound },
  { href: "/success/projects", label: "Projects", icon: FolderGit2 },
  { href: "/success/skills", label: "Skills", icon: Sparkles },
  { href: "/success/certificates", label: "Certificates", icon: BadgeCheck },
  { href: "/success/achievements", label: "Achievements", icon: Award },
  { href: "/success/resume", label: "Resume", icon: FileText },
  { href: "/success/placement", label: "Placement", icon: Briefcase },
  { href: "/success/internships", label: "Internships", icon: GraduationCap },
  { href: "/success/career-profile", label: "Career Profile", icon: Medal },
  { href: "/success/founder-profile", label: "Founder Profile", icon: Lightbulb },
  { href: "/success/settings", label: "Settings", icon: Settings }
];

export function SuccessShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-80 px-5 py-6 xl:block">
        <Link href="/success/dashboard"><Logo /></Link>
        <nav className="mt-10 space-y-2">
          {nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}
        </nav>
      </aside>
      <MobileAppNavigation homeHref="/success/dashboard" navigation={nav.map(({ href, label }) => ({ href, label }))} label="Success workspace" />
      <main className="xl:pl-80"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
