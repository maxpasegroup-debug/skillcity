import Link from "next/link";
import { ArrowRight, BadgeCheck, Brain, BriefcaseBusiness, GraduationCap, HeartHandshake, Landmark, Rocket, Shield, Sparkles, Users } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { AcademyCard } from "@/features/landing/components/academy-card";

const academies = [
  { title: "Startup Skool", description: "Build projects, validate ideas, and learn how real businesses are launched.", icon: Rocket },
  { title: "AI Skills Academy", description: "Learn practical AI skills for work, freelancing, building, marketing and daily productivity.", icon: Brain },
  { title: "Care Professionals Academy", description: "Career pathways for healthcare and care-sector professionals.", icon: HeartHandshake, comingSoon: true },
  { title: "Teacher Academy", description: "AI-powered teaching, classroom productivity and future-ready educator skills.", icon: GraduationCap, comingSoon: true },
  { title: "Internship Academy", description: "Work-readiness, projects, communication, portfolio and internship preparation.", icon: BriefcaseBusiness },
  { title: "Defence Career Academy", description: "Structured preparation pathways for defence career aspirants.", icon: Shield, comingSoon: true }
];

const programs = [
  "GenZ Builder",
  "Diploma in & as a Fullstack Entrepreneur",
  "Solo Founder",
  "Sales Mastery Live Fellowship"
];

const sections = [
  { title: "Academy-first learning", text: "Choose an academy. Follow a clear journey. Build visible proof of skills." },
  { title: "Built for September 5", text: "The first batch needs clarity from day one: what to learn, what to build, and what to do today." },
  { title: "Tara AI stays with every learner", text: "Tara helps students understand lessons, improve projects, prepare interviews and stay consistent." },
  { title: "ALTT makes learning active", text: "Understand, learn, practice, build, reflect, improve and master." },
  { title: "Every day has one mission", text: "Students should never feel lost. The platform shows the next useful action clearly." }
];

export default function HomePage() {
  return (
    <main className="scroll-smooth bg-white text-brand-dark">
      <Navbar />

      <section className="min-h-screen px-5 py-16 sm:px-8 lg:px-10">
        <Container className="grid min-h-[calc(100vh-128px)] items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="inline-flex rounded-lg bg-brand-beige px-4 py-2 text-sm font-black text-brand-red">SKILLCITY Academies</p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight text-brand-dark md:text-7xl">Build your future with AI, business and real projects.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-brand-muted">A simple AI University Operating System for students, founders and working professionals. First batch starts September 5.</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg"><Link href="#academies">Explore Academies</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/login">Login</Link></Button>
            </div>
          </div>
          <div className="rounded-lg bg-brand-card p-6 md:p-8">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="text-sm font-black text-brand-red">Today in SkillCity</p>
              <h2 className="mt-4 text-4xl font-black text-brand-dark">Learn. Build. Launch.</h2>
              <div className="mt-8 space-y-4">
                {["Tara AI mentor", "ALTT active learning", "Portfolio proof", "Community support"].map((item) => <div key={item} className="flex items-center gap-3 rounded-lg bg-brand-card p-4 font-bold text-brand-dark"><BadgeCheck className="h-5 w-5 text-brand-red" />{item}</div>)}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="academies" className="min-h-screen px-5 py-16 sm:px-8 lg:px-10">
        <Container>
          <p className="text-sm font-black uppercase text-brand-red">Six academies</p>
          <h2 className="mt-3 text-4xl font-black text-brand-dark md:text-6xl">Choose your learning city.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{academies.map((academy) => <AcademyCard key={academy.title} {...academy} />)}</div>
        </Container>
      </section>

      <section id="programs" className="min-h-screen bg-brand-card px-5 py-16 sm:px-8 lg:px-10">
        <Container>
          <p className="text-sm font-black uppercase text-brand-red">Launch programs</p>
          <h2 className="mt-3 max-w-4xl text-4xl font-black text-brand-dark md:text-6xl">Only four programs for launch clarity.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {programs.map((program, index) => {
              const slug = ["genz-builder", "fullstack-entrepreneur-diploma", "solo-founder", "sales-mastery-live-fellowship"][index];
              return <Card key={program}><CardContent className="flex min-h-56 flex-col p-7"><p className="text-sm font-black text-brand-red">Program {index + 1}</p><h3 className="mt-4 text-3xl font-black text-brand-dark">{program}</h3><Button asChild className="mt-auto w-full sm:w-fit"><Link href={`/programs/${slug}`}>View Details <ArrowRight className="h-5 w-5" /></Link></Button></CardContent></Card>;
            })}
          </div>
        </Container>
      </section>

      {sections.map((section, index) => (
        <section key={section.title} className="grid min-h-screen place-items-center px-5 py-16 sm:px-8 lg:px-10">
          <Container>
            <div className="max-w-4xl">
              <p className="text-sm font-black uppercase text-brand-red">0{index + 4}</p>
              <h2 className="mt-4 text-5xl font-black leading-tight text-brand-dark md:text-7xl">{section.title}</h2>
              <p className="mt-6 text-xl leading-9 text-brand-muted">{section.text}</p>
            </div>
          </Container>
        </section>
      ))}

      <section className="min-h-screen bg-brand-card px-5 py-16 sm:px-8 lg:px-10">
        <Container className="grid min-h-[80vh] items-center gap-8 lg:grid-cols-3">
          {[{ title: "Portfolio proof", icon: Sparkles }, { title: "Community rhythm", icon: Users }, { title: "Career outcomes", icon: Landmark }].map(({ title, icon: Icon }) => <Card key={title}><CardContent className="min-h-64 p-7"><Icon className="h-10 w-10 text-brand-red" /><h3 className="mt-6 text-3xl font-black text-brand-dark">{title}</h3><p className="mt-4 leading-7 text-brand-muted">Students graduate with evidence, confidence and direction.</p></CardContent></Card>)}
        </Container>
      </section>

      <section className="grid min-h-screen place-items-center px-5 py-16 text-center sm:px-8 lg:px-10">
        <Container>
          <p className="text-sm font-black uppercase text-brand-red">Admissions open</p>
          <h2 className="mx-auto mt-4 max-w-4xl text-5xl font-black leading-tight text-brand-dark md:text-7xl">Start with the September 5 batch.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-brand-muted">Simple learning. Real projects. Tara AI. A community that moves every day.</p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg"><Link href="/register">Register Now</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/login">Student Login</Link></Button>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
