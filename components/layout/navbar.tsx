import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/#academies", label: "Academies" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#success", label: "Success Stories" },
  { href: "/contact", label: "Contact" }
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <Container className="mt-4 flex h-20 items-center justify-between rounded-full border border-white/60 bg-white/72 px-5 shadow-[0_18px_70px_rgba(36,33,36,0.08)] backdrop-blur-xl">
        <Link href="/" aria-label="Next Gen SkillCity home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-black text-brand-dark transition hover:text-brand-red">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" className="hidden min-w-24 sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="min-w-28 rounded-full">
            <Link href="/register">Apply Now</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
