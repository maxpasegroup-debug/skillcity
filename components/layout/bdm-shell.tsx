import Link from "next/link";
import type React from "react";
import { Award, Bot, CreditCard, Gauge, Link2, MessageSquareText, Target, Trophy, Users, Wallet } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";

const nav = [
  { href: "/bdm/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/bdm/leads", label: "Assigned Leads", icon: Users },
  { href: "/bdm/referrals", label: "Referral Link", icon: Link2 },
  { href: "/bdm/commissions", label: "Commission", icon: Award },
  { href: "/bdm/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/bdm/wallet", label: "Wallet", icon: Wallet },
  { href: "/bdm/payouts", label: "Payout History", icon: CreditCard },
  { href: "/bdm/targets", label: "Target", icon: Target },
  { href: "/communications/channels", label: "Team Channels", icon: MessageSquareText },
  { href: "/bdm/tara", label: "Tara AI", icon: Bot }
];

export function BdmShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-72 px-5 py-6 lg:block">
        <Link href="/bdm/dashboard"><Logo /></Link>
        <nav className="mt-10 space-y-2">{nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}</nav>
      </aside>
      <MobileAppNavigation homeHref="/bdm/dashboard" navigation={nav.map(({ href, label }) => ({ href, label }))} label="Business development" hideAt="lg" />
      <main className="lg:pl-72"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
