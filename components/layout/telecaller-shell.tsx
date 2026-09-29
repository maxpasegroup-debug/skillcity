import Link from "next/link";
import type React from "react";
import { Gauge, MessageSquareText, PhoneCall, Users } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";

const nav = [
  { href: "/telecaller", label: "Today's Work", icon: Gauge },
  { href: "/telecaller?filter=new", label: "New Leads", icon: Users },
  { href: "/telecaller?filter=follow-up", label: "Follow-ups", icon: PhoneCall },
  { href: "/communications/channels", label: "Team Channels", icon: MessageSquareText }
];

export function TelecallerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-72 px-5 py-6 lg:block">
        <Link href="/telecaller">
          <Logo />
        </Link>
        <nav className="mt-10 space-y-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red">
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <MobileAppNavigation homeHref="/telecaller" navigation={nav.map(({ href, label }) => ({ href, label }))} label="Telecaller workspace" hideAt="lg" />
      <main className="lg:pl-72">
        <div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
