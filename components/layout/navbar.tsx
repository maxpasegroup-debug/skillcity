import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function Navbar() {
  return (
    <header className="sticky top-4 z-50">
      <Container className="flex h-20 items-center justify-between rounded-full border border-white/60 bg-white/72 px-5 shadow-[0_18px_70px_rgba(36,33,36,0.08)] backdrop-blur-xl">
        <Link href="/" aria-label="AIRA Skill City home">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/careers" className="hidden text-sm font-black text-brand-muted transition hover:text-brand-red md:inline-flex">
            Careers
          </Link>
          <Button asChild variant="secondary" className="hidden min-w-24 sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="min-w-28 rounded-full">
            <Link href="/apply">Apply Now</Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
