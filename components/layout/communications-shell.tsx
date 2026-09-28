import Link from "next/link";
import type React from "react";
import { Bell, LayoutDashboard, MessageSquareText, Workflow } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const nav = [
  { href: "/communications", label: "Delivery Log", icon: LayoutDashboard },
  { href: "/communications/templates", label: "Templates", icon: MessageSquareText },
  { href: "/communications/automations", label: "Automations", icon: Workflow },
  { href: "/notifications", label: "My Notifications", icon: Bell }
];

export function CommunicationsShell({ children }: { children: React.ReactNode }) {
  return <div className="skillcity-shell-bg min-h-screen text-brand-dark"><aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-72 px-5 py-6 xl:block"><Link href="/communications"><Logo /></Link><p className="mt-8 px-4 text-xs font-black uppercase text-brand-red">Core Communications</p><nav className="mt-4 space-y-2">{nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}</nav></aside><header className="skillcity-mobile-header sticky top-0 z-30 px-5 py-4 xl:hidden"><Logo /><nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{nav.map((item) => <Link key={item.href} href={item.href} className="shrink-0 rounded-lg border border-black/10 px-4 py-2 text-sm font-bold text-brand-muted">{item.label}</Link>)}</nav></header><main className="xl:pl-72"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main></div>;
}
