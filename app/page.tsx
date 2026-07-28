import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  PlayCircle,
  Star
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const academies = [
  {
    title: "Startup Skool",
    subtitle: "Solo Founder",
    meta: "Fullstack Entrepreneur",
    href: "/register?academy=startup-skool&type=admission",
    cta: "Apply",
    status: "Admissions Open",
    image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "AI Skills",
    subtitle: "GenZ Builder",
    meta: "Future Ready Skills",
    href: "/register?academy=ai-skills&type=waiting-list",
    cta: "Join Waitlist",
    status: "Waiting List",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Care Professionals",
    subtitle: "Healthcare + Nursing",
    meta: "Care + Wellness",
    href: "/register?academy=care-professionals&type=waiting-list",
    cta: "Join Waitlist",
    status: "Waiting List",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Teacher Academy",
    subtitle: "AI for Teachers",
    meta: "Digital Classroom",
    href: "/register?academy=teacher-academy&type=waiting-list",
    cta: "Join Waitlist",
    status: "Waiting List",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Internship Hub",
    subtitle: "Real World Exposure",
    meta: "Earn & Learn",
    href: "/register?academy=internship-hub&type=waiting-list",
    cta: "Join Waitlist",
    status: "Waiting List",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Defence Career",
    subtitle: "NDA + CDS + AFCAT",
    meta: "Agniveer & More",
    href: "/register?academy=defence-career&type=waiting-list",
    cta: "Join Waitlist",
    status: "Waiting List",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80"
  }
];

export default function HomePage() {
  return (
    <main className="bg-white text-brand-dark">
      <Navbar />

      <section
        className="relative isolate min-h-[calc(100vh-96px)] overflow-hidden bg-white bg-cover bg-right-bottom px-5 py-12 sm:px-8 lg:px-10"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 34%, rgba(255,255,255,0.38) 61%, rgba(255,255,255,0.04) 100%), url('/launch/skillcity-hero-reference.png')"
        }}
      >
        <Container className="flex min-h-[calc(100vh-192px)] items-center">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-red-50 px-5 py-3 text-sm font-black uppercase text-brand-red">
              <Star className="h-4 w-4 fill-brand-red" />
              Welcome to SkillCity
            </p>
            <h1 className="mt-7 text-6xl font-black uppercase leading-none text-brand-dark sm:text-7xl lg:text-8xl">
              Every Skill.
              <span className="block text-brand-red">One City.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-2xl font-semibold leading-10 text-brand-muted">
              Learn, build, get certified, and start your career in one place.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  <ArrowRight className="h-6 w-6" />
                  Start Learning
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#academies">
                  <PlayCircle className="h-6 w-6 text-brand-red" />
                  Explore Academies
                </Link>
              </Button>
            </div>
            <div className="mt-12 grid max-w-4xl gap-3 sm:grid-cols-3">
              {[
                { label: "Online + Offline", icon: Building2 },
                { label: "Live Mentorship", icon: BookOpenCheck },
                { label: "Career Support", icon: CheckCircle2 }
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-lg bg-white/90 p-4 shadow-soft backdrop-blur">
                  <Icon className="h-6 w-6 text-brand-red" />
                  <p className="mt-3 text-sm font-black text-brand-dark">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section id="academies" className="min-h-screen bg-[#07080d] px-4 py-12 text-white sm:px-6 md:py-16 lg:px-8">
        <Container>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase text-brand-red">Academies</p>
              <h2 className="mt-3 text-4xl font-black md:text-6xl">Choose your path.</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/70">
              Startup Skool is open for admissions. Other academies are collecting waiting list applications.
            </p>
          </div>
          <div id="programs" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {academies.map((academy) => (
              <Link
                key={academy.title}
                href={academy.href}
                className="group relative min-h-80 overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-2xl transition duration-300 hover:-translate-y-2 hover:rotate-1 hover:border-brand-red hover:shadow-[0_24px_80px_rgba(235,0,27,0.26)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url('${academy.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-black uppercase text-white backdrop-blur">
                  {academy.status}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="text-2xl font-black leading-tight">{academy.title}</h3>
                  <p className="mt-2 text-sm font-bold text-white/85">{academy.subtitle}</p>
                  <p className="mt-1 text-xs font-semibold text-white/65">{academy.meta}</p>
                  <div className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-red text-white shadow-lg transition group-hover:scale-110">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-xs font-black uppercase text-white/70">{academy.cta}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
