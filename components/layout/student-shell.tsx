import Link from "next/link";
import type React from "react";
import { Award, CalendarDays, CreditCard, Home, ListChecks, MessageCircle, Settings, Sparkles, Users, Workflow } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/my-journey", label: "My Journey", icon: Workflow },
  { href: "/todays-tasks", label: "Today's Tasks", icon: ListChecks },
  { href: "/projects", label: "Projects", icon: Sparkles },
  { href: "/success/dashboard", label: "Success", icon: Award },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/community-hub/feed", label: "Community", icon: Users },
  { href: "/wallet", label: "Wallet", icon: CreditCard },
  { href: "/tara", label: "AI Tara", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-brand-dark">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-black/5 bg-white px-5 py-6 lg:block">
        <Link href="/dashboard" aria-label="SkillCity dashboard">
          <Logo />
        </Link>
        <nav className="mt-10 space-y-2" aria-label="Student navigation">
          {navigation.map((item) => (
            <StudentNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>
      </aside>
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 px-5 py-4 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" aria-label="SkillCity dashboard">
            <Logo />
          </Link>
          <Button asChild variant="secondary" className="px-4">
            <Link href="/tara">Ask Tara</Link>
          </Button>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Student mobile navigation">
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
      <main className="lg:pl-72">
        <div className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>
      <Button asChild className="fixed bottom-5 right-5 z-50 shadow-soft" size="lg">
        <Link href="/tara">
          <MessageCircle className="h-5 w-5" />
          Ask Tara
        </Link>
      </Button>
    </div>
  );
}

function StudentNavLink({
  href,
  label,
  icon: Icon
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-bold text-brand-muted transition hover:bg-brand-card hover:text-brand-red"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
