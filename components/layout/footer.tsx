import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const links = [
  { href: "/#programs", label: "Programs" },
  { href: "/#admissions", label: "Admissions" },
  { href: "/#success", label: "Success Stories" },
  { href: "/#about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/application-status", label: "Application Status" },
  { href: "/admin-login", label: "Login" }
];

const policyLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/privacy#terms", label: "Terms" },
  { href: "/privacy#refund", label: "Refund Policy" }
];

export function Footer() {
  return (
    <footer id="success" className="border-t border-black/5 bg-white py-10">
      <Container className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-xl">
          <Logo />
          <p className="mt-4 text-sm font-semibold leading-6 text-brand-muted">
            AIRA Skill City is owned by MIB - MAKE IT BEAUTIFUL LLP. Built for entrepreneurs, professionals and future leaders.
          </p>
        </div>
        <div className="space-y-5">
          <nav className="flex flex-wrap gap-x-6 gap-y-3 lg:justify-end" aria-label="Footer navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-black text-brand-dark transition hover:text-brand-red">
                {link.label}
              </Link>
            ))}
          </nav>
          <nav className="flex flex-wrap gap-x-5 gap-y-3 lg:justify-end" aria-label="Policy navigation">
            {policyLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs font-bold text-brand-muted transition hover:text-brand-red">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
