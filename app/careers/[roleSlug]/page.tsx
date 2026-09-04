import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCareerRole, isCareerRoleOpen } from "@/features/careers/catalog";
import { buildAdmissionsWhatsAppUrl } from "@/config/admissions";

type Props = { params: Promise<{ roleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roleSlug } = await params;
  const role = getCareerRole(roleSlug);
  return { title: role ? `${role.title} | Careers at AIRA Skill City` : "Careers at AIRA Skill City" };
}

export default async function CareerRolePage({ params }: Props) {
  const { roleSlug } = await params;
  const role = getCareerRole(roleSlug);
  if (!role) notFound();
  const isRelationshipManager = role.slug === "relationship-manager";
  const isOpen = isCareerRoleOpen(role.slug);

  return (
    <main className="skillcity-shell-bg min-h-screen text-brand-dark">
      <Navbar />
      <section className="bg-brand-dark px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-brand-gold">{role.category.title}</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-none sm:text-7xl">{role.title}</h1>
          <p className="mt-6 max-w-3xl text-xl font-semibold leading-8 text-white/68">{role.intro}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {isOpen ? (
              <Button asChild size="lg" className="rounded-full">
                <Link href={`/careers/${role.slug}/apply`}>
                  Apply for this role
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" disabled className="rounded-full">Opening later</Button>
            )}
            <Button asChild size="lg" variant="secondary" className="rounded-full border-white/15 bg-white/10 text-white hover:bg-white hover:text-brand-dark">
              <a href={buildAdmissionsWhatsAppUrl(`Hi AIRA Skill City, I want to know more about the ${role.title} career opportunity.`)} target="_blank" rel="noreferrer">
                Talk to AIRA Skill City
                <MessageCircle className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            {isRelationshipManager ? <RelationshipManagerPathway /> : null}
            <InfoCard title="What You Will Do" items={role.responsibilities} />
            <InfoCard title="What We Are Looking For" items={role.requirements} />
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-black uppercase text-brand-red">Career Growth</p>
                <p className="mt-3 text-lg font-semibold leading-8 text-brand-muted">{role.growth}</p>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-5">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-black uppercase text-brand-red">Location / Work Mode</p>
                <p className="mt-3 text-xl font-black text-brand-dark">{role.workMode}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-black uppercase text-brand-red">Application</p>
                <p className="mt-3 font-semibold leading-7 text-brand-muted">Your application goes to the dedicated HR recruitment workflow, not student admissions.</p>
                {isOpen ? (
                  <Button asChild className="mt-5 w-full rounded-full">
                    <Link href={`/careers/${role.slug}/apply`}>Apply for this role</Link>
                  </Button>
                ) : (
                  <Button disabled className="mt-5 w-full rounded-full">Opening later</Button>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-black uppercase text-brand-red">{title}</p>
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <div key={item} className="flex gap-3 rounded-lg bg-white p-4 font-semibold text-brand-muted">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RelationshipManagerPathway() {
  const steps = ["Relationship Manager", "3-Month Performance-Based Development Program", "Target Achievement", "Franchise Manager Opportunity", "Potential AIRA Skill City Centre Leadership"];
  return (
    <Card className="border-brand-gold/35">
      <CardContent className="p-6">
        <p className="text-sm font-black uppercase text-brand-red">Career Path</p>
        <div className="mt-5 grid gap-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg bg-brand-dark p-4 text-white">
              <p className="text-xs font-black text-brand-gold">STEP {index + 1}</p>
              <p className="mt-1 text-xl font-black">{step}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 font-semibold leading-8 text-brand-muted">
          From Day 1, selected candidates enter a 3-month performance-based development program. An example performance target is 120 student admissions during the development period. Successful candidates may become eligible for progression to Franchise Manager and the opportunity to lead an AIRA Skill City centre, subject to company evaluation, business requirements and applicable terms.
        </p>
      </CardContent>
    </Card>
  );
}
