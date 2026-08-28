import Link from "next/link";
import type React from "react";
import { Award, Bell, CalendarDays, Flag, GraduationCap, Home, Landmark, MessageSquare, Settings, ShoppingBag, Trophy, Users, Wallet } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const nav = [
  { href: "/community-hub/feed", label: "Community Feed", icon: Home },
  { href: "/community-hub/groups", label: "My Groups", icon: Users },
  { href: "/community-hub/my-batch", label: "My Batch", icon: GraduationCap },
  { href: "/community-hub/announcements", label: "Announcements", icon: Bell },
  { href: "/community-hub/discussions", label: "Discussions", icon: MessageSquare },
  { href: "/community-hub/events", label: "Events", icon: CalendarDays },
  { href: "/community-hub/hackathons", label: "Hackathons", icon: Flag },
  { href: "/community-hub/challenges", label: "Challenges", icon: Award },
  { href: "/community-hub/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/community-hub/alumni", label: "Alumni", icon: Landmark },
  { href: "/community-hub/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/community-hub/wallet", label: "Wallet", icon: Wallet },
  { href: "/community-hub/settings", label: "Settings", icon: Settings }
];

export function CommunityShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-80 px-5 py-6 xl:block">
        <Link href="/community-hub/feed"><Logo /></Link>
        <nav className="mt-10 space-y-2">{nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}</nav>
      </aside>
      <header className="skillcity-mobile-header sticky top-0 z-30 px-5 py-4 xl:hidden"><Link href="/community-hub/feed"><Logo /></Link><nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{nav.map((item) => <Link key={item.href} href={item.href} className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-brand-muted">{item.label}</Link>)}</nav></header>
      <main className="xl:pl-80"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
