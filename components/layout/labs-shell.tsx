import Link from "next/link";
import type React from "react";
import { Boxes, LayoutDashboard } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";

const nav = [
  { href: "/labs", label: "Product Catalog", icon: Boxes },
  { href: "/executive/dashboard", label: "Core Dashboard", icon: LayoutDashboard }
];

export function LabsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <aside className="skillcity-sidebar fixed inset-y-0 left-0 hidden w-72 px-5 py-6 xl:block">
        <Link href="/labs" aria-label="AIRA Labs product catalog"><Logo /></Link>
        <p className="mt-8 px-4 text-sm font-black uppercase text-brand-red">AIRA Labs</p>
        <nav className="mt-4 space-y-2" aria-label="AIRA Labs navigation">
          {nav.map((item) => <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-4 py-3 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red"><item.icon className="h-5 w-5" />{item.label}</Link>)}
        </nav>
      </aside>
      <MobileAppNavigation homeHref="/labs" navigation={nav.map(({ href, label }) => ({ href, label }))} label="AIRA Labs" />
      <main className="xl:pl-72"><div className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div></main>
    </div>
  );
}
