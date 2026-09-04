import type { Metadata } from "next";
import { PublicApplicationForm } from "@/features/apply/components/public-application-form";

export const metadata: Metadata = {
  title: "Apply to AIRA Skill City",
  description: "Apply for Startup Skool or AIRA Labs at AIRA Skill City."
};

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ program?: string; ref?: string }> }) {
  const params = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-dark text-brand-dark">
      <div className="absolute inset-0 skillcity-dark-grid opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(198,155,67,0.24),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(235,0,27,0.28),transparent_34%)]" />
      <div className="relative min-h-screen blur-sm">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-brand-gold">AIRA Skill City</p>
          <h1 className="mt-5 max-w-4xl text-6xl font-black uppercase leading-none text-white sm:text-8xl">Nexa admissions is opening.</h1>
          <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-white/58">Your AI-guided Skill City application experience is ready.</p>
        </div>
      </div>
      <PublicApplicationForm initialProgramSlug={params.program} referralId={params.ref} />
    </main>
  );
}
