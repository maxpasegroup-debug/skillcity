import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CircleDollarSign,
  Crown,
  Handshake,
  Lightbulb,
  LineChart,
  Megaphone,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  WandSparkles
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const livePrograms = [
  {
    title: "Startup Skool",
    text: "Build, validate and launch a real business.",
    icon: Rocket,
    href: "/programs/solo-founder"
  },
  {
    title: "GenZ Builder",
    text: "Become an AI powered full stack creator.",
    icon: WandSparkles,
    href: "/programs/genz-builder"
  },
  {
    title: "AI Sales Mastery",
    text: "Learn modern selling with AI workflows.",
    icon: LineChart,
    href: "/programs/sales-mastery-live-fellowship"
  },
  {
    title: "AI Skills Arena",
    text: "Build practical AI skills for daily work.",
    icon: Bot,
    href: "/academies/ai-skills-academy"
  }
];

const comingSoon = [
  "Care Professional",
  "Home Schooling Professional",
  "AI Teaching Professional",
  "AI Office Professional",
  "AI Marketing Professional",
  "AI Content Creator",
  "AI Business Consultant",
  "Digital Village Professional",
  "Startup Incubator",
  "Leadership Academy"
];

const altt = [
  { title: "Learn by Doing", icon: Lightbulb },
  { title: "Build Real Projects", icon: Building2 },
  { title: "Generate Real Revenue", icon: CircleDollarSign },
  { title: "Transform Yourself", icon: Sparkles }
];

const journey = ["Dream", "Learn", "Build", "Launch", "Earn", "Grow"];

const whyChoose = [
  { title: "AI Powered", icon: Bot },
  { title: "Practical Learning", icon: BadgeCheck },
  { title: "Industry Mentors", icon: UsersRound },
  { title: "Build Your Brand", icon: Crown },
  { title: "Entrepreneur Community", icon: Handshake },
  { title: "Future Ready", icon: ShieldCheck }
];

export default function HomePage() {
  return (
    <main className="bg-white text-brand-dark">
      <Navbar />

      <section
        className="relative isolate min-h-screen overflow-hidden bg-white bg-cover bg-[74%_center] pt-28"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.99) 0%, rgba(255,255,255,0.96) 38%, rgba(255,255,255,0.72) 55%, rgba(255,255,255,0.08) 100%), url('/launch/skillcity-hero-reference.png')"
        }}
      >
        <Container className="flex min-h-[calc(100vh-112px)] items-center py-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-white/80 px-5 py-3 text-sm font-black uppercase text-brand-red shadow-soft backdrop-blur">
              <Star className="h-4 w-4 fill-brand-gold text-brand-gold" />
              AIRA Skill City
            </p>
            <h1 className="mt-8 text-6xl font-black uppercase leading-[0.9] text-black sm:text-7xl lg:text-8xl">
              Learn.
              <span className="block text-brand-red">Build.</span>
              <span className="block text-brand-gold">Earn.</span>
              <span className="block">Grow.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-xl font-semibold leading-8 text-brand-muted sm:text-2xl">
              India&apos;s AI Powered Practical Learning Ecosystem.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-16 rounded-full px-9 shadow-[0_22px_70px_rgba(235,0,27,0.28)]">
                <Link href="/register">
                  Apply Now
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-16 rounded-full border-brand-gold/40 px-9">
                <Link href="#programs">
                  <PlayCircle className="h-6 w-6 text-brand-red" />
                  Explore Programs
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section id="about" className="bg-white py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Why AIRA Skill City?" title="An AI Skill University for transformation." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["AI Powered", "Tara AI supports learning and decision-making."],
              ["Practical", "Students learn through action, projects and reflection."],
              ["Institutional", "One premium city for skills, business and leadership."]
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-black/8 bg-[#fbfaf7] p-8 shadow-soft">
                <div className="h-1 w-14 bg-brand-gold" />
                <h3 className="mt-8 text-3xl font-black text-black">{title}</h3>
                <p className="mt-4 text-base font-semibold leading-7 text-brand-muted">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="programs" className="bg-[#080806] py-16 text-white sm:py-24">
        <Container>
          <SectionHeading eyebrow="Live Programs" title="Start with the right doorway." invert />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {livePrograms.map(({ title, text, icon: Icon, href }) => (
              <Link
                key={title}
                href={href}
                className="group min-h-80 rounded-lg border border-white/10 bg-white/[0.04] p-7 transition duration-300 hover:-translate-y-2 hover:border-brand-gold hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-red text-white shadow-[0_18px_50px_rgba(235,0,27,0.32)]">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-16 text-3xl font-black uppercase leading-none">{title}</h3>
                <p className="mt-4 text-base font-semibold leading-7 text-white/65">{text}</p>
                <p className="mt-8 inline-flex items-center gap-2 text-sm font-black uppercase text-brand-gold">
                  Learn More <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[#fbfaf7] py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Coming Soon" title="A future-ready professional city." />
          <div className="mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {comingSoon.map((item, index) => (
              <div key={item} className="rounded-lg border border-black/8 bg-white p-5 shadow-sm">
                <p className="text-xs font-black text-brand-gold">0{index + 1}</p>
                <h3 className="mt-4 text-lg font-black text-black">{item}</h3>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow="ALTT" title="Active learning, not passive watching." />
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {altt.map(({ title, icon: Icon }) => (
              <div key={title} className="rounded-lg border border-black/8 bg-white p-7 shadow-soft">
                <Icon className="h-8 w-8 text-brand-red" />
                <h3 className="mt-10 text-2xl font-black text-black">{title}</h3>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[#080806] py-16 text-white sm:py-24">
        <Container>
          <SectionHeading eyebrow="Student Journey" title="Dream to growth, one step at a time." invert />
          <div className="mt-12 grid gap-3 md:grid-cols-6">
            {journey.map((step, index) => (
              <div key={step} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-black text-brand-gold">0{index + 1}</p>
                <h3 className="mt-8 text-2xl font-black uppercase">{step}</h3>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Why Choose AIRA" title="Built for people who want proof." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {whyChoose.map(({ title, icon: Icon }) => (
              <div key={title} className="rounded-lg border border-black/8 bg-[#fbfaf7] p-7 shadow-sm">
                <Icon className="h-7 w-7 text-brand-red" />
                <h3 className="mt-10 text-2xl font-black text-black">{title}</h3>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="success" className="bg-[#fbfaf7] py-16 sm:py-24">
        <Container>
          <div className="grid gap-8 rounded-lg border border-black/8 bg-white p-8 shadow-soft lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">Success Stories</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-none text-black sm:text-6xl">Future ready.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {["Project wins", "Revenue stories", "Career shifts"].map((item) => (
                <div key={item} className="rounded-lg bg-[#fbfaf7] p-5">
                  <Megaphone className="h-6 w-6 text-brand-gold" />
                  <p className="mt-8 text-lg font-black text-black">{item}</p>
                  <p className="mt-2 text-sm font-semibold text-brand-muted">Video friendly after cohort milestones.</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section id="admissions" className="relative overflow-hidden bg-brand-red py-16 text-white sm:py-24">
        <div className="absolute inset-0 skillcity-red-lines opacity-30" />
        <Container className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Admissions</p>
            <h2 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-none sm:text-7xl">
              Apply for transformation.
            </h2>
          </div>
          <Button asChild size="lg" variant="secondary" className="h-16 rounded-full border-white bg-white px-10 text-brand-dark hover:border-white hover:text-brand-red">
            <Link href="/register">
              Apply Now
              <ArrowRight className="h-6 w-6" />
            </Link>
          </Button>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

function SectionHeading({ eyebrow, title, invert = false }: { eyebrow: string; title: string; invert?: boolean }) {
  return (
    <div className="max-w-4xl">
      <p className={`text-sm font-black uppercase tracking-[0.2em] ${invert ? "text-brand-gold" : "text-brand-red"}`}>{eyebrow}</p>
      <h2 className={`mt-4 text-4xl font-black uppercase leading-none sm:text-6xl ${invert ? "text-white" : "text-black"}`}>{title}</h2>
    </div>
  );
}
