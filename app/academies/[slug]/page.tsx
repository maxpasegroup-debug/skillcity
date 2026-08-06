import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { academies, launchPrograms } from "@/features/launch/content";

export function generateStaticParams() {
  return academies.map((academy) => ({ slug: academy.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const academy = academies.find((item) => item.slug === params.slug);
  if (!academy) return {};
  return { title: academy.title, description: academy.mission, openGraph: { title: academy.title, description: academy.mission } };
}

export default function AcademyPage({ params }: { params: { slug: string } }) {
  const academy = academies.find((item) => item.slug === params.slug);
  if (!academy) notFound();
  const Icon = academy.icon;
  const linkedPrograms = launchPrograms.filter((program) => academy.programs.includes(program.title));
  return <main className="bg-white text-brand-dark"><Navbar /><section className="px-5 py-16 sm:px-8 lg:px-10"><Container><div className="grid gap-10 lg:grid-cols-[1fr_340px]"><div><p className="text-sm font-black uppercase text-brand-red">Academy</p><h1 className="mt-4 text-5xl font-black leading-tight md:text-7xl">{academy.title}</h1><p className="mt-6 max-w-3xl text-xl leading-9 text-brand-muted">{academy.mission}</p>{academy.comingSoon ? <p className="mt-6 inline-flex rounded-lg bg-brand-beige px-4 py-2 font-black text-brand-red">Coming Soon</p> : null}</div><Card><CardContent className="grid min-h-60 place-items-center p-8"><Icon className="h-20 w-20 text-brand-red" /></CardContent></Card></div></Container></section><Container className="space-y-12 pb-16"><Block title="Mission" items={[academy.mission]} /><Block title="Programs" items={academy.programs} links={linkedPrograms} /><Block title="Career Paths" items={academy.paths} /><Block title="Future Roadmap" items={academy.roadmap} /><div className="flex flex-col gap-4 sm:flex-row"><Button asChild size="lg"><Link href="/apply">{academy.comingSoon ? "Join Waitlist" : "Apply Now"}</Link></Button><Button asChild size="lg" variant="secondary"><Link href="/#academies">View All Academies</Link></Button></div></Container><Footer /></main>;
}

function Block({ title, items, links = [] }: { title: string; items: string[]; links?: { slug: string; title: string }[] }) {
  return <section><h2 className="text-3xl font-black text-brand-dark">{title}</h2><div className="mt-5 grid gap-5 md:grid-cols-3">{items.map((item) => { const link = links.find((program) => program.title === item); return <Card key={item}><CardContent className="min-h-32 p-6"><p className="font-bold leading-7 text-brand-muted">{item}</p>{link ? <Button asChild className="mt-5 w-full" variant="secondary"><Link href={`/programs/${link.slug}`}>View Program <ArrowRight className="h-4 w-4" /></Link></Button> : null}</CardContent></Card>; })}</div></section>;
}
