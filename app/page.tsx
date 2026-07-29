import Link from "next/link";
import type React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  BriefcaseBusiness,
  GraduationCap,
  HeartHandshake,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Trophy
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const academies = [
  { title: "Startup Skool", subtitle: "Founder builders", href: "/register?academy=startup-skool&type=admission", icon: Rocket, status: "Open" },
  { title: "AI Skills", subtitle: "GenZ builders", href: "/register?academy=ai-skills&type=waiting-list", icon: Brain, status: "Waitlist" },
  { title: "Care Pros", subtitle: "Wellness careers", href: "/register?academy=care-professionals&type=waiting-list", icon: HeartHandshake, status: "Waitlist" },
  { title: "Teacher", subtitle: "AI classrooms", href: "/register?academy=teacher-academy&type=waiting-list", icon: GraduationCap, status: "Waitlist" },
  { title: "Internship", subtitle: "Earn and learn", href: "/register?academy=internship-hub&type=waiting-list", icon: BriefcaseBusiness, status: "Waitlist" },
  { title: "Defence", subtitle: "NDA + CDS", href: "/register?academy=defence-career&type=waiting-list", icon: Shield, status: "Waitlist" }
];

const flow = [
  { title: "Learn", detail: "Live + guided", icon: Radio },
  { title: "Build", detail: "Projects first", icon: Sparkles },
  { title: "Certify", detail: "Proof of skill", icon: BadgeCheck },
  { title: "Launch", detail: "Career support", icon: Trophy }
];

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-white text-brand-dark">
      <Navbar />

      <section className="relative isolate min-h-[calc(100vh-96px)] bg-[#fbfbf8]">
        <div className="absolute inset-0 skillcity-paper" />
        <div className="absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block">
          <CityStage />
        </div>

        <Container className="relative grid min-h-[calc(100vh-96px)] items-center gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-red/15 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-brand-red shadow-soft">
              <Sparkles className="h-4 w-4" />
              Admissions open
            </p>
            <h1 className="mt-7 max-w-4xl text-[4.2rem] font-black uppercase leading-[0.86] text-brand-dark sm:text-[6.5rem] lg:text-[7.8rem]">
              Every Skill.
              <span className="block text-brand-red">One City.</span>
            </h1>
            <p className="mt-7 max-w-xl text-xl font-semibold leading-8 text-brand-muted sm:text-2xl sm:leading-10">
              Learn. Build. Certify. Launch.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="skillcity-cta h-16 px-8 text-lg">
                <Link href="/register">
                  <ArrowRight className="h-6 w-6" />
                  Start Learning
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-16 border-brand-red/25 px-8 text-lg">
                <Link href="#academies">Explore Academies</Link>
              </Button>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-black/10 bg-black/10 sm:grid-cols-4">
              {flow.map(({ title, detail, icon: Icon }) => (
                <div key={title} className="bg-white/90 p-4 backdrop-blur">
                  <Icon className="h-5 w-5 text-brand-red" />
                  <p className="mt-3 text-base font-black uppercase">{title}</p>
                  <p className="mt-1 text-sm font-bold text-brand-muted">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[420px] lg:hidden">
            <CityStage />
          </div>
        </Container>
      </section>

      <section id="academies" className="relative bg-[#08090d] py-16 text-white sm:py-20">
        <div className="absolute inset-0 skillcity-dark-grid" />
        <Container className="relative">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-red">Academy districts</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black uppercase leading-none sm:text-6xl">
                Choose your route.
              </h2>
            </div>
            <p className="max-w-md text-base font-semibold leading-7 text-white/62">
              One city. Six directions. Startup Skool is open now.
            </p>
          </div>

          <div id="programs" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {academies.map((academy, index) => (
              <AcademyDistrict key={academy.title} academy={academy} index={index} />
            ))}
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="bg-white py-16 sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-red">How it moves</p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-none sm:text-6xl">A path, not a course.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {flow.map(({ title, detail, icon: Icon }, index) => (
                <div key={title} className="group relative min-h-44 overflow-hidden rounded-lg border border-black/10 bg-brand-card p-5">
                  <div className="absolute left-0 top-0 h-1 w-full bg-brand-red" style={{ opacity: 1 - index * 0.12 }} />
                  <Icon className="h-7 w-7 text-brand-red transition group-hover:scale-110" />
                  <p className="mt-8 text-2xl font-black uppercase">{title}</p>
                  <p className="mt-2 text-sm font-bold text-brand-muted">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-brand-red py-12 text-white">
        <div className="absolute inset-0 skillcity-red-lines" />
        <Container className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">September launch batch</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none sm:text-5xl">Enter SkillCity.</h2>
          </div>
          <Button asChild size="lg" variant="secondary" className="h-14 border-white bg-white px-8 text-brand-dark hover:border-white hover:text-brand-red">
            <Link href="/register">
              Apply Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

function CityStage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center lg:justify-end">
      <div className="relative h-[390px] w-full max-w-[680px] sm:h-[500px]">
        <div className="absolute inset-x-4 bottom-6 h-28 rounded-[50%] border border-black/10 bg-white/60 blur-[1px]" />
        <div className="absolute inset-x-10 bottom-14 h-44 skillcity-road" />
        <div className="absolute bottom-20 left-[12%] h-52 w-20 rounded-t-lg border border-black/10 bg-white shadow-soft skillcity-float" />
        <div className="absolute bottom-24 left-[27%] h-72 w-24 rounded-t-lg border border-black/10 bg-white shadow-soft skillcity-float-delay" />
        <div className="absolute bottom-20 right-[18%] h-60 w-24 rounded-t-lg border border-black/10 bg-white shadow-soft skillcity-float" />
        <div className="absolute bottom-16 right-[5%] h-44 w-20 rounded-t-lg border border-black/10 bg-white shadow-soft skillcity-float-delay" />

        <div className="absolute bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-t-[9rem] border-[18px] border-white bg-transparent shadow-[0_28px_80px_rgba(36,33,36,0.16)]">
          <div className="absolute -left-8 bottom-0 h-56 w-10 bg-brand-red" />
          <div className="absolute -right-8 bottom-0 h-56 w-10 bg-brand-red" />
          <div className="absolute left-1/2 top-12 -translate-x-1/2 text-center">
            <p className="text-4xl font-black uppercase tracking-normal text-brand-red">SkillCity</p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.28em] text-brand-muted">Future starts here</p>
          </div>
        </div>

        <div className="absolute bottom-16 left-1/2 h-40 w-[5px] -translate-x-1/2 overflow-hidden rounded-full bg-brand-red/20">
          <div className="h-20 w-full rounded-full bg-brand-red skillcity-scan" />
        </div>

        <div className="absolute right-8 top-8 hidden rounded-full border border-brand-red/20 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-brand-red shadow-soft sm:block">
          Live city map
        </div>
      </div>
    </div>
  );
}

function AcademyDistrict({
  academy,
  index
}: {
  academy: {
    title: string;
    subtitle: string;
    href: string;
    status: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  index: number;
}) {
  const Icon = academy.icon;

  return (
    <Link
      href={academy.href}
      className="group relative min-h-64 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:-translate-y-2 hover:border-brand-red hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red md:min-h-72"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-brand-red" style={{ opacity: 1 - index * 0.1 }} />
      <div className="absolute inset-0 skillcity-card-lines opacity-40 transition group-hover:opacity-80" />
      <div className="relative flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase text-white/70">{academy.status}</span>
        <span className="text-xs font-black text-white/35">0{index + 1}</span>
      </div>
      <div className="absolute bottom-16 left-4 right-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-red text-white shadow-[0_18px_48px_rgba(235,0,27,0.35)] transition group-hover:scale-110">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-6 max-w-[14rem] text-3xl font-black uppercase leading-none">{academy.title}</h3>
        <p className="mt-3 text-sm font-bold text-white/60">{academy.subtitle}</p>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Enter</span>
        <ArrowRight className="h-5 w-5 text-brand-red transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
