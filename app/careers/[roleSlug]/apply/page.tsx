import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CareerApplicationForm } from "@/features/careers/components/career-application-form";
import { getCareerRole, isCareerRoleOpen } from "@/features/careers/catalog";

type Props = { params: Promise<{ roleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roleSlug } = await params;
  const role = getCareerRole(roleSlug);
  return { title: role ? `Apply for ${role.title} | AIRA Skill City` : "Career Application | AIRA Skill City" };
}

export default async function CareerApplyPage({ params }: Props) {
  const { roleSlug } = await params;
  const role = getCareerRole(roleSlug);
  if (!role || !isCareerRoleOpen(role.slug)) notFound();

  return (
    <main className="skillcity-shell-bg min-h-screen text-brand-dark">
      <Navbar />
      <section className="px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <Link href={`/careers/${role.slug}`} className="inline-flex items-center gap-2 text-sm font-black text-brand-muted hover:text-brand-red">
            <ArrowLeft className="h-4 w-4" />
            Back to role
          </Link>
          <div className="mt-7">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-red">{role.category.title}</p>
            <h1 className="mt-3 text-4xl font-black text-brand-dark md:text-6xl">Apply for {role.title}</h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-brand-muted">This is a career application for AIRA Skill City HR recruitment. It will not create a student admission application.</p>
          </div>
          <Card className="mt-8">
            <CardContent className="p-6 md:p-8">
              <CareerApplicationForm role={{ slug: role.slug, title: role.title, category: { slug: role.category.slug, title: role.category.title } }} />
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </main>
  );
}
