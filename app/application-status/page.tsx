import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ApplicationStatusForm } from "@/features/apply/components/application-status-form";

export const metadata: Metadata = {
  title: "Application Status",
  description: "Check your AIRA Skill City admission application status using your WhatsApp number."
};

export default function ApplicationStatusPage() {
  return (
    <main className="skillcity-shell-bg text-brand-dark">
      <Navbar />
      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <Container>
          <div className="mb-10 max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">Admissions</p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-none text-black sm:text-7xl">Application status.</h1>
            <p className="mt-6 max-w-2xl text-xl font-semibold leading-9 text-brand-muted">
              Check whether your application is under review, approved, or ready for WhatsApp PIN login.
            </p>
            <Button asChild variant="secondary" className="mt-7 rounded-full">
              <Link href="/apply">Submit new application</Link>
            </Button>
          </div>
          <ApplicationStatusForm />
        </Container>
      </section>
      <Footer />
    </main>
  );
}
