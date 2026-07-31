import Link from "next/link";
import { ArrowRight, BookOpenCheck, BriefcaseBusiness, PlayCircle, Star, Trophy, UsersRound } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const academyCards = [
  {
    title: "Startup Skool",
    subtitle: "Become a Full Stack Entrepreneur",
    badge: "Admissions Open",
    href: "/register?academy=startup-skool&type=admission",
    image: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=900&q=80",
    accent: "text-brand-red",
    button: "Admissions Open"
  },
  {
    title: "AI Skills",
    subtitle: "Build Future-Ready AI Skills",
    badge: "Waiting List",
    href: "/register?academy=ai-skills&type=waiting-list",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=80",
    accent: "text-[#0D7DD8]",
    button: "Join Waiting List"
  },
  {
    title: "Care Professionals",
    subtitle: "Healthcare + Nursing Care + Wellness",
    badge: "Waiting List",
    href: "/register?academy=care-professionals&type=waiting-list",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80",
    accent: "text-[#E53B7A]",
    button: "Join Waiting List"
  },
  {
    title: "Teacher Academy",
    subtitle: "AI for Teachers Digital Classroom",
    badge: "Waiting List",
    href: "/register?academy=teacher-academy&type=waiting-list",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
    accent: "text-[#F05A28]",
    button: "Join Waiting List"
  },
  {
    title: "Internship Hub",
    subtitle: "Real World Exposure Earn & Learn",
    badge: "Waiting List",
    href: "/register?academy=internship-hub&type=waiting-list",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    accent: "text-[#7156D9]",
    button: "Join Waiting List"
  },
  {
    title: "Defence Career",
    subtitle: "NDA + CDS + AFCAT Agniveer & More",
    badge: "Waiting List",
    href: "/register?academy=defence-career&type=waiting-list",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80",
    accent: "text-[#188447]",
    button: "Join Waiting List"
  }
];

const trustItems = [
  { title: "Online + Offline", text: "Flexible learning rhythm", icon: BookOpenCheck },
  { title: "Live Mentorship", text: "Guidance from real people", icon: UsersRound },
  { title: "Certificates", text: "Proof students can share", icon: Trophy },
  { title: "Placement Support", text: "Career readiness support", icon: BriefcaseBusiness }
];

export default function HomePage() {
  return (
    <main className="bg-white text-brand-dark">
      <Navbar />

      <section
        className="relative isolate min-h-[calc(100vh-96px)] overflow-hidden bg-white bg-cover bg-[72%_bottom]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.99) 0%, rgba(255,255,255,0.96) 35%, rgba(255,255,255,0.68) 54%, rgba(255,255,255,0.04) 100%), url('/launch/skillcity-hero-reference.png')"
        }}
      >
        <Container className="flex min-h-[calc(100vh-96px)] items-center py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-red-50 px-5 py-3 text-sm font-black uppercase text-brand-red shadow-sm">
              <Star className="h-4 w-4 fill-brand-red" />
              Welcome to SkillCity
            </p>
            <h1 className="mt-7 text-6xl font-black uppercase leading-none text-black sm:text-7xl md:text-8xl">
              Every Skill.
              <span className="block text-brand-red">One City.</span>
            </h1>
            <p className="mt-7 max-w-xl text-xl font-semibold leading-8 text-brand-muted sm:text-2xl">
              Learn. Practice. Succeed. All in one place.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-16 rounded-lg px-8 shadow-[0_20px_60px_rgba(235,0,27,0.28)]">
                <Link href="/register">
                  Apply Now
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-16 rounded-lg border-brand-red/30 px-8">
                <Link href="#how-it-works">
                  <PlayCircle className="h-6 w-6 text-brand-red" />
                  How It Works
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section id="academies" className="min-h-screen bg-white py-14 sm:py-18">
        <Container>
          <div className="mx-auto flex max-w-xl items-center justify-center gap-5 text-center">
            <span className="h-px w-16 bg-brand-red" />
            <h2 className="text-2xl font-black uppercase tracking-normal text-black sm:text-3xl">
              Explore Our <span className="text-brand-red">Academies</span>
            </h2>
            <span className="h-px w-16 bg-brand-red" />
          </div>

          <div id="programs" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {academyCards.map((academy, index) => (
              <AcademyCard key={academy.title} academy={academy} index={index} />
            ))}
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="bg-[#fbfbf8] py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red">How it works</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-none text-black sm:text-6xl">
                Simple path. Real outcomes.
              </h2>
              <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-brand-muted">
                Students choose an academy, apply, join the right batch, and build proof of skills with Tara AI and mentors.
              </p>
              <Button asChild size="lg" className="mt-8 h-14 px-8">
                <Link href="/register">
                  Start Application
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {trustItems.map(({ title, text, icon: Icon }) => (
                <div key={title} className="rounded-lg border border-black/8 bg-white p-6 shadow-soft">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-brand-red">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-2xl font-black text-black">{title}</h3>
                  <p className="mt-2 text-base font-semibold leading-7 text-brand-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

function AcademyCard({
  academy,
  index
}: {
  academy: {
    title: string;
    subtitle: string;
    badge: string;
    href: string;
    image: string;
    accent: string;
    button: string;
  };
  index: number;
}) {
  return (
    <Link
      href={academy.href}
      className="group relative min-h-[360px] overflow-hidden rounded-[1.15rem] border border-black/8 bg-white shadow-[0_18px_55px_rgba(36,33,36,0.13)] transition duration-300 hover:-translate-y-3 hover:rotate-[0.7deg] hover:shadow-[0_26px_80px_rgba(36,33,36,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red"
      style={{ animation: `skillcity-card-float ${5.6 + index * 0.24}s ease-in-out infinite`, animationDelay: `${index * -0.36}s` }}
    >
      <div className="absolute inset-x-0 top-0 h-[58%] overflow-hidden">
        <div
          className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url('${academy.image}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/18 to-transparent" />
      </div>

      <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-black uppercase text-white backdrop-blur">
        {academy.badge}
      </div>

      <div className="absolute inset-x-0 bottom-0 rounded-t-[1.4rem] bg-white px-4 pb-5 pt-6 text-center">
        <h3 className={`text-2xl font-black leading-none ${academy.accent}`}>{academy.title}</h3>
        <p className="mx-auto mt-3 min-h-10 max-w-[10rem] text-xs font-semibold leading-5 text-brand-muted">{academy.subtitle}</p>
        <span className="mt-5 inline-flex h-10 items-center justify-center rounded-full border border-black/10 px-4 text-xs font-black text-brand-dark transition group-hover:border-brand-red group-hover:bg-brand-red group-hover:text-white">
          {academy.button}
        </span>
      </div>
    </Link>
  );
}
