import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, CalendarDays, IndianRupee } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { FAQSection, SocialProofSections } from "@/features/launch/components/content-sections";
import { launchPrograms } from "@/features/launch/content";

export function generateStaticParams() {
  return launchPrograms.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = launchPrograms.find((item) => item.slug === slug);
  if (!program) return {};
  return { title: program.title, description: program.outcome, openGraph: { title: program.title, description: program.outcome } };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = launchPrograms.find((item) => item.slug === slug);
  if (!program) notFound();
  const related = launchPrograms.filter((item) => item.slug !== program.slug).slice(0, 3);
  const applySlug = getApplicationGatewaySlug(program.slug);

  return (
    <main className="skillcity-shell-bg text-brand-dark">
      <Navbar />
      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <Container className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-black uppercase text-brand-red">{program.academy}</p>
            <h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">{program.title}</h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-brand-muted">{program.outcome}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row"><Button asChild size="lg"><Link href={`/apply?program=${applySlug}`}>{getApplyLabel(program.slug)}</Link></Button><Button asChild size="lg" variant="secondary"><Link href="/contact">Talk to Admissions</Link></Button></div>
          </div>
          <Card><CardContent className="p-6"><IndianRupee className="h-8 w-8 text-brand-red" /><h2 className="mt-4 text-2xl font-black">Launch Offer</h2><p className="mt-3 font-bold text-brand-muted">{program.launchOffer}</p><p className="mt-5 text-3xl font-black text-brand-dark">{program.bookingAmount}</p></CardContent></Card>
        </Container>
      </section>
      <Container className="space-y-12 pb-16">
        <ProgramHighlights slug={program.slug} />
        <InfoGrid title="Career Outcome" items={[program.outcome]} />
        <InfoGrid title="Who Should Join" items={program.who} />
        <InfoGrid title="Learning Journey" items={program.journey} />
        <InfoGrid title="Projects" items={program.projects} />
        <InfoGrid title="Mentorship" items={[program.mentorship]} />
        <InfoGrid title="Internship" items={[program.internship]} />
        <InfoGrid title="Certification" items={[program.certification]} />
        <InfoGrid title="Fee" items={[program.fee]} />
        <InfoGrid title="Important Dates" items={program.importantDates} icon={CalendarDays} />
        <FAQSection items={program.faqs} />
        <SocialProofSections />
        <section>
          <h2 className="text-3xl font-black text-brand-dark">Related Programs</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">{related.map((item) => <Card key={item.slug}><CardContent className="p-6"><h3 className="text-xl font-black text-brand-dark">{item.title}</h3><Button asChild className="mt-5 w-full" variant="secondary"><Link href={`/programs/${item.slug}`}>View Program <ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>)}</div>
        </section>
      </Container>
      <Footer />
    </main>
  );
}

function ProgramHighlights({ slug }: { slug: string }) {
  if (slug === "startup-skool") {
    return (
      <section>
        <h2 className="text-3xl font-black text-brand-dark">Program Structure</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Card>
            <CardContent className="min-h-40 p-6">
              <p className="text-sm font-black uppercase text-brand-red">Duration</p>
              <p className="mt-3 text-2xl font-black text-brand-dark">6 Months</p>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">A 180-day builder journey to shape, launch and grow your own brand.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="min-h-40 p-6">
              <p className="text-sm font-black uppercase text-brand-red">Channels</p>
              <p className="mt-3 text-2xl font-black text-brand-dark">Solo Founder</p>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">For creators, freelancers and idea-stage founders building independently.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="min-h-40 p-6">
              <p className="text-sm font-black uppercase text-brand-red">Channel</p>
              <p className="mt-3 text-2xl font-black text-brand-dark">Full Stack Entrepreneur</p>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">For builders who want product, sales, systems and execution depth.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (slug === "aira-labs") {
    return (
      <section>
        <h2 className="text-3xl font-black text-brand-dark">Selection Path</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Card>
            <CardContent className="min-h-40 p-6">
              <p className="text-sm font-black uppercase text-brand-red">Duration</p>
              <p className="mt-3 text-2xl font-black text-brand-dark">1 Year</p>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">A deeper AI Product Engineering pathway for serious builders.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="min-h-40 p-6">
              <p className="text-sm font-black uppercase text-brand-red">Admission</p>
              <p className="mt-3 text-2xl font-black text-brand-dark">Interview Based</p>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">Apply first. Shortlisted applicants will be invited for interview.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="min-h-40 p-6">
              <p className="text-sm font-black uppercase text-brand-red">Seats</p>
              <p className="mt-3 text-2xl font-black text-brand-dark">Limited</p>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">Designed as an exclusive lab, not an open mass-admission course.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return null;
}

function getApplicationGatewaySlug(slug: string) {
  if (slug === "aira-labs") return "aira-labs";
  if (slug === "startup-skool") return "startup-skool";
  if (slug === "genz-builder") return "genz-builder";
  if (slug === "sales-mastery-live-fellowship") return "nicejobs-sales-mastery";
  return "startup-skool";
}

function getApplyLabel(slug: string) {
  if (slug === "startup-skool") return "Apply for Startup Skool";
  if (slug === "aira-labs") return "Apply for AIRA Labs";
  return "Apply Now";
}

function InfoGrid({ title, items, icon: Icon = BadgeCheck }: { title: string; items: string[]; icon?: React.ComponentType<{ className?: string }> }) {
  return <section><h2 className="text-3xl font-black text-brand-dark">{title}</h2><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Card key={item}><CardContent className="flex min-h-28 gap-4 p-5"><Icon className="mt-1 h-5 w-5 shrink-0 text-brand-red" /><p className="font-bold leading-7 text-brand-muted">{item}</p></CardContent></Card>)}</div></section>;
}
