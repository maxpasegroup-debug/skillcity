import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { PublicApplicationForm } from "@/features/apply/components/public-application-form";

export const metadata: Metadata = {
  title: "Apply to AIRA Skill City",
  description: "Apply for Startup Skool, GenZ Builder, or NiceJobs Sales Mastery free internship at AIRA Skill City."
};

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ program?: string; ref?: string }> }) {
  const params = await searchParams;

  return (
    <main className="bg-[#fbfaf7] text-brand-dark">
      <Navbar />
      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <Container>
          <div className="mb-10 max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">NEXA AI Admissions</p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-none text-black sm:text-7xl">Guided application.</h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-brand-muted">
              NEXA AI will guide each step. Dashboards open only after the Admission Cell approves your admission.
            </p>
          </div>
          <PublicApplicationForm initialProgramSlug={params.program} referralId={params.ref} />
        </Container>
      </section>
      <Footer />
    </main>
  );
}
