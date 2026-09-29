import Link from "next/link";
import type React from "react";
import { Bell, LayoutDashboard, MessageSquareText, Users, Workflow } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";

type Access = { channels: boolean; operations: boolean; templates: boolean; automations: boolean };

export function CommunicationsShell({ children, access }: { children: React.ReactNode; access: Access }) {
  const nav = [
    access.channels ? { href: "/communications/channels", label: "Team Channels", icon: Users } : null,
    access.operations ? { href: "/communications", label: "Delivery Log", icon: LayoutDashboard } : null,
    access.templates ? { href: "/communications/templates", label: "Templates", icon: MessageSquareText } : null,
    access.automations ? { href: "/communications/automations", label: "Automations", icon: Workflow } : null,
    { href: "/notifications", label: "My Notifications", icon: Bell },
    { href: "/workspace", label: "My Workspaces", icon: LayoutDashboard }
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  return <div className="skillcity-shell-bg min-h-screen text-brand-dark"><aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-72 px-5 py-6 xl:block"><Link href={nav[0]?.href ?? "/workspace"}><Logo /></Link><p className="mt-8 px-4 text-xs font-black uppercase text-brand-red">Core Communications</p><nav className="mt-4 space-y-2">{nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}</nav></aside><MobileAppNavigation homeHref={nav[0]?.href ?? "/workspace"} navigation={nav.map(({ href, label }) => ({ href, label }))} label="Communications" /><main className="xl:pl-72"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main></div>;
}
