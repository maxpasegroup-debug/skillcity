import Link from "next/link";
import { MobileAppNavigation } from "@/components/layout/mobile-app-navigation";
import { Logo } from "@/components/ui/logo";

const navigation = [
  { href: "/career", label: "Career Home" },
  { href: "/career/opportunities", label: "Opportunities" },
  { href: "/career/applications", label: "Applications" },
  { href: "/career/referrals", label: "Referrals" },
  { href: "/career/profile", label: "My Profile" }
];

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return <div className="skillcity-shell-bg min-h-screen text-brand-dark"><header className="hidden border-b border-black/8 bg-white/90 px-8 py-4 backdrop-blur lg:block"><div className="mx-auto flex max-w-7xl items-center justify-between gap-6"><Link href="/career"><Logo /></Link><nav className="flex flex-wrap justify-end gap-1" aria-label="Career Hub navigation">{navigation.map((item) => <Link key={item.href} href={item.href} className="flex min-h-11 items-center rounded-lg px-4 font-bold text-brand-muted hover:bg-brand-card hover:text-brand-red">{item.label}</Link>)}</nav></div></header><MobileAppNavigation homeHref="/career" navigation={navigation} label="Career Hub" hideAt="lg" /><main className="skillcity-shell-content mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main></div>;
}
