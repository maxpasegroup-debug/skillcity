"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Brain,
  Building2,
  CircleDollarSign,
  Compass,
  Hammer,
  Handshake,
  MapPin,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  Zap
} from "lucide-react";
import { NexaOnboardingModal } from "@/features/apply/components/nexa-onboarding-modal";

const programs = [
  {
    title: "Startup School",
    subtitle: "Build a business, not just a plan.",
    image: "/launch/v2/startup-school.png",
    href: "/apply?program=startup-skool"
  },
  {
    title: "GenZ Builder - Vibe Coding",
    subtitle: "Create with AI, code and design.",
    image: "/launch/v2/genz-builder.png",
    href: "/apply?program=genz-builder"
  },
  {
    title: "Sales Mastery",
    subtitle: "Learn confidence, communication and closing.",
    image: "/launch/v2/sales-mastery.png",
    href: "/apply?program=nicejobs-sales-mastery"
  }
];

const skillCity = [
  { title: "Learn", text: "Master practical skills.", icon: Brain },
  { title: "Build", text: "Create real projects.", icon: Hammer },
  { title: "Earn", text: "Find real opportunities.", icon: CircleDollarSign },
  { title: "Grow", text: "Become future ready.", icon: Trophy }
];

const whyAira = [
  { title: "AI First", icon: Bot },
  { title: "Learn by Building", icon: Building2 },
  { title: "Mentor Guidance", icon: UsersRound },
  { title: "Real Projects", icon: ShieldCheck },
  { title: "Startup Mindset", icon: Rocket },
  { title: "Earn While Learning", icon: CircleDollarSign }
];

const journey = ["Discover", "Learn", "Build", "Launch", "Earn", "Grow"];

export function AiraLandingV2() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyProgram, setApplyProgram] = useState<string | undefined>();

  useEffect(() => {
    function syncApplyState() {
      const params = new URLSearchParams(window.location.search);
      const shouldOpen = params.get("apply") === "1";
      setApplyOpen(shouldOpen);
      setApplyProgram(params.get("program") ?? undefined);
    }

    syncApplyState();
    window.addEventListener("popstate", syncApplyState);
    return () => window.removeEventListener("popstate", syncApplyState);
  }, []);

  function openApplyExperience(href: string) {
    const targetUrl = new URL(href, window.location.origin);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("apply", "1");
    const program = targetUrl.searchParams.get("program");

    if (program) {
      nextUrl.searchParams.set("program", program);
    } else {
      nextUrl.searchParams.delete("program");
    }

    setApplyProgram(program ?? undefined);
    setApplyOpen(true);
    window.history.pushState({ nexaApply: true }, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }

  function closeApplyExperience() {
    if (new URLSearchParams(window.location.search).get("apply") === "1") {
      window.history.back();
      return;
    }
    setApplyOpen(false);
  }

  useEffect(() => {
    let cleanup = () => {};

    async function animate() {
      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.gsap;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;

      gsap.registerPlugin(ScrollTrigger);

      const root = rootRef.current;
      if (!root) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      const ctx = gsap.context(() => {
        gsap.from(".aira-hero-copy > *", {
          y: 36,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08
        });

        gsap.from(".aira-hero-image", {
          y: 42,
          scale: 0.96,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          delay: 0.15
        });

        gsap.utils.toArray<HTMLElement>(".aira-reveal").forEach((item) => {
          gsap.from(item, {
            y: 34,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 84%"
            }
          });
        });

        gsap.utils.toArray<HTMLElement>(".aira-card").forEach((item) => {
          gsap.from(item, {
            y: 28,
            opacity: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 88%"
            }
          });
        });

        gsap.from(".aira-timeline-step", {
          x: -24,
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: ".aira-timeline",
            start: "top 78%"
          }
        });
      }, root);

      cleanup = () => ctx.revert();
    }

    animate();
    return () => cleanup();
  }, []);

  return (
    <main ref={rootRef} className="min-h-screen overflow-hidden bg-[#242124] text-[#FFFFFF]">
      <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[#242124]/62 px-5 shadow-[0_18px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <Link href="/" aria-label="AIRA Skill City home" className="group">
            <span className="block text-xl font-black uppercase leading-none tracking-normal sm:text-2xl">
              <span className="text-[#C69B43] transition group-hover:text-[#FFFFFF]">AIRA</span>{" "}
              <span className="text-[#FFFFFF]">Skill City</span>
            </span>
            <span className="mt-1 hidden text-[9px] font-black uppercase tracking-[0.22em] text-[#65605D] sm:block">AI Research & Advancement</span>
          </Link>
          <ApplyLaunchLink href="/apply" onOpen={openApplyExperience} className="rounded-full bg-[#EB001B] px-5 py-3 text-sm font-black text-white shadow-[0_18px_48px_rgba(235,0,27,0.32)] transition hover:-translate-y-0.5 hover:bg-[#cc0017]">
            Apply Now
          </ApplyLaunchLink>
        </div>
      </header>

      <section className="relative isolate min-h-screen overflow-hidden px-4 pt-28 sm:px-6 lg:px-10">
        <div className="absolute inset-0 bg-[#242124]" />
        <div className="aira-hero-image absolute inset-y-0 right-0 hidden w-[61vw] lg:block">
          <Image src="/launch/v2/hero-campus.png" alt="Indian students collaborating in a modern AIRA Skill City innovation campus" fill priority sizes="61vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#242124_0%,rgba(36,33,36,0.82)_18%,rgba(36,33,36,0.32)_48%,rgba(36,33,36,0.1)_100%),linear-gradient(180deg,rgba(36,33,36,0.1)_0%,#242124_100%)]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,155,67,0.2),transparent_28%),radial-gradient(circle_at_36%_92%,rgba(235,0,27,0.24),transparent_24%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C69B43]/45 to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl items-center py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="aira-hero-copy max-w-4xl">
            <p className="inline-flex rounded-full border border-[#C69B43]/35 bg-[#C69B43]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-[#C69B43] shadow-[0_0_44px_rgba(198,155,67,0.14)]">
              A modern campus for builders
            </p>
            <h1 className="mt-8 text-[clamp(4.5rem,10.5vw,10.8rem)] font-black uppercase leading-[0.77] tracking-normal text-[#FFFFFF]">
              Build
              <span className="block text-[#C69B43]">Your</span>
              <span className="block">Future</span>
            </h1>
            <p className="mt-8 text-[clamp(2.2rem,4.2vw,5rem)] font-black uppercase leading-none text-[#FFFFFF]">
              Learn. <span className="text-[#C69B43]">Build.</span> Earn. <span className="text-[#EB001B]">Grow.</span>
            </p>
            <p className="mt-7 max-w-lg text-xl font-semibold leading-8 text-[#65605D]">
              A modern learning campus where ideas become careers.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="#journeys" className="inline-flex h-16 items-center justify-center gap-3 rounded-full bg-[#EB001B] px-8 text-base font-black text-white shadow-[0_24px_70px_rgba(235,0,27,0.34)] transition hover:-translate-y-1 hover:bg-[#cc0017]">
                Explore Programs
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/contact" className="inline-flex h-16 items-center justify-center gap-3 rounded-full border border-[#C69B43]/45 bg-white/[0.03] px-8 text-base font-black text-[#FFFFFF] transition hover:-translate-y-1 hover:border-[#C69B43] hover:bg-[#C69B43]/10">
                Visit Campus
                <MapPin className="h-5 w-5 text-[#C69B43]" />
              </Link>
            </div>

            <div className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
              {["Admissions Open", "Founding Batch", "Practical Campus"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C69B43]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-10 min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#2F2A2E] shadow-[0_40px_110px_rgba(0,0,0,0.65)] lg:hidden">
            <Image src="/launch/v2/hero-campus.png" alt="Indian students collaborating in a modern AIRA Skill City innovation campus" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(36,33,36,0.86)_100%)]" />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-8 right-6 hidden max-w-xs rounded-[1.5rem] border border-white/10 bg-[#242124]/62 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl lg:block">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C69B43]">Inside AIRA</p>
          <p className="mt-3 text-lg font-black leading-6 text-[#FFFFFF]">A place where ambitious people come to build.</p>
        </div>

        <a href="#what-is-skill-city" aria-label="Scroll to next section" className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#65605D]">
          Scroll
          <ArrowDown className="h-5 w-5 animate-bounce text-[#C69B43]" />
        </a>
      </section>

      <section id="what-is-skill-city" className="px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="What is Skill City?" title="A place where people learn practical skills, build real projects, start earning and create the future they dream of." />
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {skillCity.map(({ title, text, icon: Icon }) => (
              <article key={title} className="aira-card group rounded-[1.4rem] border border-white/10 bg-[#2F2A2E] p-7 transition duration-300 hover:-translate-y-2 hover:border-[#C69B43]/60 hover:shadow-[0_24px_80px_rgba(198,155,67,0.12)]">
                <Icon className="h-10 w-10 text-[#C69B43]" />
                <h2 className="mt-14 text-3xl font-black uppercase">{title}</h2>
                <p className="mt-3 text-base font-semibold leading-7 text-[#65605D]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="journeys" className="px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Choose Your Journey" title="Three doors. One city. Your next version." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {programs.map((program) => (
              <ApplyLaunchLink key={program.title} href={program.href} onOpen={openApplyExperience} className="aira-card group relative min-h-[620px] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#2F2A2E] shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
                <Image src={program.image} alt={`${program.title} at AIRA Skill City`} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.18)_38%,rgba(36,33,36,0.94)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-7">
                  <h2 className="text-5xl font-black uppercase leading-none">{program.title}</h2>
                  <p className="mt-4 max-w-xs text-lg font-semibold leading-7 text-[#65605D]">{program.subtitle}</p>
                  <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#242124] transition group-hover:bg-[#C69B43]">
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </ApplyLaunchLink>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Why AIRA" title="Built for ambitious people who want proof, momentum and community." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyAira.map(({ title, icon: Icon }) => (
              <article key={title} className="aira-card rounded-[1.4rem] border border-white/10 bg-[#2F2A2E] p-7 transition hover:-translate-y-2 hover:border-[#EB001B]/70">
                <Icon className="h-9 w-9 text-[#EB001B]" />
                <h2 className="mt-16 text-3xl font-black uppercase leading-none">{title}</h2>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32">
        <div className="aira-reveal px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionTitle eyebrow="Campus Experience" title="Workspaces designed for ideas, people and momentum." />
          </div>
        </div>
        <div className="aira-card relative mt-12 min-h-[460px] overflow-hidden border-y border-white/10 lg:min-h-[680px]">
          <Image src="/launch/v2/campus-gallery.png" alt="AIRA Skill City campus experience with students networking, coding and presenting" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(36,33,36,0.72),transparent_46%,rgba(36,33,36,0.3)),linear-gradient(180deg,transparent_54%,#242124_100%)]" />
          <div className="absolute bottom-8 left-4 max-w-xl rounded-[1.5rem] border border-white/10 bg-[#242124]/70 p-6 backdrop-blur-md sm:left-8 lg:left-14">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#C69B43]">Not a classroom</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-none">A startup campus feeling.</h2>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Our Learning Journey" title="From discovering your direction to growing your future." />
          <div className="aira-timeline mt-14 grid gap-4 lg:grid-cols-6">
            {journey.map((step, index) => (
              <div key={step} className="aira-timeline-step relative rounded-[1.2rem] border border-white/10 bg-[#2F2A2E] p-6">
                <p className="text-sm font-black text-[#C69B43]">0{index + 1}</p>
                <h2 className="mt-10 text-2xl font-black uppercase">{step}</h2>
                {index < journey.length - 1 ? <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-[#C69B43]/60 lg:block" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="aira-reveal mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-[#C69B43]/25 bg-[#2F2A2E] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.42)] lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#C69B43]">Why Join Now?</p>
            <h2 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-none sm:text-7xl">Become Part of Our Founding Batch</h2>
            <p className="mt-6 max-w-2xl text-xl font-semibold leading-8 text-[#65605D]">
              Join AIRA Skill City at the beginning of an exciting journey and help build the future alongside passionate learners and mentors.
            </p>
          </div>
          <ApplyLaunchLink href="/apply" onOpen={openApplyExperience} className="inline-flex h-16 items-center justify-center rounded-full bg-[#EB001B] px-9 text-base font-black text-white transition hover:-translate-y-1 hover:bg-[#cc0017]">
            Admissions Open
          </ApplyLaunchLink>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="aira-reveal">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#C69B43]">Floating AI Assistant</p>
            <h2 className="mt-5 text-6xl font-black uppercase leading-none sm:text-8xl">Meet Tara</h2>
          </div>
          <div className="aira-card rounded-[2rem] border border-white/10 bg-[#2F2A2E] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.38)]">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#C69B43] text-[#242124]">
                <Bot className="h-7 w-7" />
              </div>
              <div>
                <p className="font-black text-[#FFFFFF]">Tara AI</p>
                <p className="text-sm font-semibold text-[#65605D]">Your calm learning companion.</p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.4rem] bg-[#242124] p-6">
              <p className="text-xl font-semibold leading-8 text-[#FFFFFF]">
                “Tell me what you want to become. I will help you take the next step.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-10 lg:py-32">
        <div className="aira-reveal mx-auto max-w-7xl rounded-[2.2rem] bg-[#FFFFFF] p-8 text-[#242124] lg:p-14">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#EB001B]">Final Call</p>
          <h2 className="mt-5 max-w-5xl text-6xl font-black uppercase leading-none sm:text-8xl">Your Future Starts Here.</h2>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ApplyLaunchLink href="/apply" onOpen={openApplyExperience} className="inline-flex h-16 items-center justify-center gap-3 rounded-full bg-[#EB001B] px-9 text-base font-black text-white transition hover:-translate-y-1 hover:bg-[#cc0017]">
              Apply Now
              <ArrowRight className="h-5 w-5" />
            </ApplyLaunchLink>
            <Link href="/contact" className="inline-flex h-16 items-center justify-center gap-3 rounded-full border border-[#242124]/15 px-9 text-base font-black transition hover:-translate-y-1 hover:border-[#C69B43] hover:bg-[#C69B43]/15">
              Book Campus Visit
              <Compass className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <Link href="/tara" aria-label="Meet Tara AI" className="fixed bottom-5 right-5 z-40 hidden rounded-full border border-[#C69B43]/35 bg-[#2F2A2E]/86 p-4 text-[#C69B43] shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-[#C69B43] hover:text-[#242124] sm:block">
        <MessageCircle className="h-6 w-6" />
      </Link>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-black uppercase"><span className="text-[#C69B43]">AIRA</span> Skill City</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-[#65605D]">AI Research & Advancement</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#65605D]">
            <span>admissions@airaskillcity.com</span>
            <span>airaskillcity.com</span>
            <span>Kerala, India</span>
            <span className="inline-flex gap-3 text-[#C69B43]"><Zap className="h-4 w-4" /><Handshake className="h-4 w-4" /><Sparkles className="h-4 w-4" /></span>
          </div>
        </div>
      </footer>

      <NexaOnboardingModal key={applyProgram ?? "default-apply"} open={applyOpen} initialProgramSlug={applyProgram} onClose={closeApplyExperience} />
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="aira-reveal max-w-5xl">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-[#C69B43]">{eyebrow}</p>
      <h2 className="mt-5 text-4xl font-black uppercase leading-none text-[#FFFFFF] sm:text-6xl lg:text-7xl">{title}</h2>
    </div>
  );
}

function ApplyLaunchLink({ href, className, children, onOpen }: { href: string; className: string; children: ReactNode; onOpen: (href: string) => void }) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        onOpen(href);
      }}
    >
      {children}
    </a>
  );
}
