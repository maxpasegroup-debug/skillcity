import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/#academies", label: "Academies" },
  { href: "/#programs", label: "Programs" },
  { href: "/admission-process", label: "How It Works" },
  { href: "/contact", label: "Contact" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <Container className="flex h-24 items-center justify-between py-4">
        <Link href="/" aria-label="Next Gen SkillCity home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-base font-semibold text-brand-muted transition hover:text-brand-red">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" className="hidden min-w-24 sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="min-w-32">
            <Link href="/register">Start Learning</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
