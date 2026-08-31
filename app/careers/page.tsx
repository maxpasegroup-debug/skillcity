import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { careerCategories } from "@/features/careers/catalog";

export const metadata: Metadata = {
  title: "Careers at AIRA Skill City",
  description: "Build your career. Build the future at AIRA Skill City."
};

export default function CareersPage() {
  return (
    <main className="skillcity-shell-bg min-h-screen text-brand-dark">
      <Navbar />
      <section className="relative overflow-hidden bg-brand-dark px-5 py-24 text-white sm:px-8 lg:px-10 lg:py-32">
        <div className="absolute inset-0 skillcity-dark-grid opacity-70" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent" />
        <div className="relative mx-auto max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-gold/35 bg-brand-gold/10 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-brand-gold">
            <Sparkles className="h-4 w-4" />
            Careers at AIRA Skill City
          </p>
          <h1 className="mt-7 max-w-5xl text-5xl font-black uppercase leading-none sm:text-7xl lg:text-8xl">Build your career. Build the future.</h1>
          <p className="mt-7 max-w-3xl text-xl font-semibold leading-8 text-white/68">
            Join a growing ecosystem where technology, education, entrepreneurship and real-world opportunities come together.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <a href="#roles">
                Explore Roles
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full border-white/15 bg-white/10 text-white hover:bg-white hover:text-brand-dark">
              <Link href="/apply">Learn Pathway</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="roles" className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-red">Career Opportunities</p>
              <h2 className="mt-3 text-4xl font-black text-brand-dark md:text-5xl">Choose your sector</h2>
            </div>
            <p className="max-w-xl font-semibold leading-7 text-brand-muted">Career applications are handled by HR and are kept separate from student admissions.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {careerCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.slug} className="overflow-hidden">
                  <CardContent className="p-6 md:p-7">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-beige text-brand-red">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-brand-red">CATEGORY {category.number}</p>
                        <h3 className="mt-2 text-2xl font-black text-brand-dark">{category.title}</h3>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {category.roles.map((role) => (
                        <Link key={role.slug} href={`/careers/${role.slug}`} className="group flex min-h-20 items-center justify-between gap-4 rounded-lg bg-white p-4 font-black text-brand-dark transition hover:-translate-y-1 hover:text-brand-red hover:shadow-soft">
                          <span>{role.title}</span>
                          <ArrowRight className="h-5 w-5 shrink-0 text-brand-red transition group-hover:translate-x-1" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-lg border border-brand-gold/25 bg-brand-dark p-7 text-white md:p-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-gold">Relationship Manager Pathway</p>
              <h2 className="mt-3 text-3xl font-black">A performance-based route into leadership.</h2>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/careers/relationship-manager">
                View Pathway
                <BriefcaseBusiness className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
