import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const links = [
  { href: "/#programs", label: "Programs" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/login", label: "Login" },
  { href: "/privacy", label: "Privacy" },
  { href: "mailto:contact@skillcity.in", label: "Contact" }
];

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white py-10">
      <Container className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-brand-muted">Owned by MIB - MAKE IT BEAUTIFUL LLP</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-brand-muted transition hover:text-brand-red">
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
