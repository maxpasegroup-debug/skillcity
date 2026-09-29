import Link from "next/link";
import type React from "react";
import { Bell, Gauge, MessageSquareText, Users } from "lucide-react";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { href: "/advisor/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/advisor/students", label: "My Students", icon: Users },
  { href: "/communications/channels", label: "Team Channels", icon: MessageSquareText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/workspace", label: "Workspaces", icon: Gauge }
];

export function AdvisorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-72 px-5 py-6 xl:block">
        <Link href="/advisor/dashboard"><Logo /></Link>
        <p className="mt-8 px-4 text-xs font-black uppercase text-brand-red">Academic Advisor</p>
        <nav className="mt-4 space-y-2" aria-label="Academic Advisor navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}
        </nav>
      </aside>
      <MobileAppNavigation homeHref="/advisor/dashboard" navigation={navigation.map(({ href, label }) => ({ href, label }))} label="Academic Advisor" />
      <main className="xl:pl-72"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
