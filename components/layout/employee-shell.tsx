import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";

const navigation = [
  { href: "/employees", label: "Employees" },
  { href: "/dashboard", label: "Dashboard" }
];

export function EmployeeShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="skillcity-shell-bg min-h-screen text-brand-dark">
      <header className="hidden border-b border-black/8 bg-white/90 px-5 py-4 backdrop-blur sm:px-8 lg:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard"><Logo /></Link>
          <nav className="flex items-center gap-2">
            <Link href="/employees" className="flex h-11 items-center gap-2 rounded-lg px-4 font-bold text-brand-dark hover:bg-brand-card">
              <Users className="h-5 w-5" /> Employees
            </Link>
            <Link href="/dashboard" className="flex h-11 items-center gap-2 rounded-lg border border-black/10 px-4 font-bold text-brand-muted hover:text-brand-red">
              <ArrowLeft className="h-5 w-5" /> Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <MobileAppNavigation homeHref="/employees" navigation={navigation} label="Employee workspace" hideAt="lg" />
      <main className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
