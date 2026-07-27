import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  BriefcaseBusiness,
  CalendarCheck,
  GraduationCap,
  HeartHandshake,
  IndianRupee,
  Rocket,
  Shield,
  Sparkles
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { AcademyCard } from "@/features/landing/components/academy-card";
import { launchPrograms } from "@/features/launch/content";

const academies = [
  { title: "Startup Skool", description: "Build projects, validate ideas, and learn how real businesses are launched.", icon: Rocket },
  { title: "AI Skills Academy", description: "Learn practical AI skills for work, freelancing, building, marketing and daily productivity.", icon: Brain },
  { title: "Care Professionals Academy", description: "Career pathways for healthcare and care-sector professionals.", icon: HeartHandshake, comingSoon: true },
  { title: "Teacher Academy", description: "AI-powered teaching, classroom productivity and future-ready educator skills.", icon: GraduationCap, comingSoon: true },
  { title: "Internship Academy", description: "Work-readiness, projects, communication, portfolio and internship preparation.", icon: BriefcaseBusiness },
  { title: "Defence Career Academy", description: "Structured preparation pathways for defence career aspirants.", icon: Shield, comingSoon: true }
];

const admissionSteps = ["Apply", "Book counselling", "Reserve seat", "Start batch"];

export default function HomePage() {
  return (
    <main className="bg-white text-brand-dark">
      <Navbar />

      <section className="px-5 py-14 sm:px-8 md:py-20 lg:px-10">
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_0.78fr]">
          <div>
            <p className="inline-flex rounded-lg bg-brand-beige px-4 py-2 text-sm font-black text-brand-red">
              September 5 launch batch
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight text-brand-dark md:text-7xl">
              Build your future with AI, business and real projects.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-brand-muted">
              SkillCity is an AI University Operating System for students, founders and working professionals who want clear daily learning and proof of skills.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">Apply Now</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#programs">View Programs</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg bg-brand-card p-5 md:p-7">
            <div className="rounded-lg bg-white p-6 shadow-soft">
              <p className="text-sm font-black uppercase text-brand-red">Today in SkillCity</p>
              <h2 className="mt-4 text-4xl font-black text-brand-dark">One mission. One mentor. One clear path.</h2>
              <div className="mt-7 grid gap-3">
                {["Tara AI mentor", "ALTT active learning", "Portfolio proof", "Community support"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg bg-brand-card p-4 font-bold text-brand-dark">
                    <BadgeCheck className="h-5 w-5 shrink-0 text-brand-red" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="academies" className="border-t border-black/5 px-5 py-14 sm:px-8 md:py-20 lg:px-10">
        <Container>
          <p className="text-sm font-black uppercase text-brand-red">Six academies</p>
          <h2 className="mt-3 text-4xl font-black text-brand-dark md:text-6xl">Choose your learning city.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {academies.map((academy) => (
              <AcademyCard key={academy.title} {...academy} />
            ))}
          </div>
        </Container>
      </section>

      <section id="programs" className="bg-brand-card px-5 py-14 sm:px-8 md:py-20 lg:px-10">
        <Container>
          <p className="text-sm font-black uppercase text-brand-red">Launch programs</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-black text-brand-dark md:text-6xl">
            Four focused programs for the first batch.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {launchPrograms.map((program) => (
              <Card key={program.slug}>
                <CardContent className="flex min-h-72 flex-col p-7">
                  <p className="text-sm font-black text-brand-red">{program.academy}</p>
                  <h3 className="mt-4 text-3xl font-black leading-tight text-brand-dark">{program.title}</h3>
                  <p className="mt-4 leading-7 text-brand-muted">{program.outcome}</p>
                  <Button asChild className="mt-auto w-full sm:w-fit">
                    <Link href={`/programs/${program.slug}`}>
                      View Details <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="px-5 py-14 sm:px-8 md:py-20 lg:px-10">
        <Container className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-black uppercase text-brand-red">Admissions made simple</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-brand-dark md:text-6xl">
              Know exactly what happens after you apply.
            </h2>
            <p className="mt-5 text-lg leading-8 text-brand-muted">
              The first batch experience is designed for clarity: apply, speak with admissions, reserve your seat, then start with Tara AI and your batch.
            </p>
            <Button asChild size="lg" className="mt-8 w-full sm:w-fit">
              <Link href="/admission-process">See Admission Process</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {admissionSteps.map((step, index) => (
              <Card key={step}>
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-red text-lg font-black text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-brand-dark">{step}</h3>
                  <p className="mt-3 leading-7 text-brand-muted">A clear step with admissions support.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-brand-card px-5 py-14 text-center sm:px-8 md:py-20 lg:px-10">
        <Container>
          <p className="text-sm font-black uppercase text-brand-red">Admissions open</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-5xl font-black leading-tight text-brand-dark md:text-7xl">
            Start with the September 5 batch.
          </h2>
          <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { label: "Seat booking", value: "INR 20,000", icon: IndianRupee },
              { label: "Batch starts", value: "September 5", icon: CalendarCheck },
              { label: "Learning style", value: "ALTT + Tara AI", icon: Sparkles }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-white p-5 text-left shadow-sm">
                <Icon className="h-6 w-6 text-brand-red" />
                <p className="mt-4 text-sm font-black uppercase text-brand-muted">{label}</p>
                <p className="mt-1 text-xl font-black text-brand-dark">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">Apply Now</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/contact">Talk to Admissions</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
