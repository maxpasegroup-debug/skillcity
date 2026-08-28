import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="skillcity-shell-bg min-h-screen">
      <Container className="grid min-h-screen items-center py-8">
        <div className="skillcity-shell-content mx-auto w-full max-w-md">
          <Link href="/" aria-label="Skill City home">
            <Logo />
          </Link>
          <div className="mt-10 rounded-lg border border-black/8 bg-white/90 p-6 shadow-soft backdrop-blur sm:p-8">
            <h1 className="text-3xl font-bold text-brand-dark">{title}</h1>
            <p className="mt-3 text-base leading-7 text-brand-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </Container>
    </main>
  );
}
