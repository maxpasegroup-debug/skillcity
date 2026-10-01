import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, Boxes, BrainCircuit, FlaskConical, Layers3, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "AIRA Labs | Build Intelligent Products",
  description: "AIRA Labs is AIRA Skill City's product and technology division for AI systems, applications, automation and practical product engineering.",
  alternates: { canonical: "https://airalabs.com" }
};

const capabilities = [
  { icon: BrainCircuit, title: "AI Product Engineering", body: "Turn useful intelligence into focused products with clear users, workflows and outcomes." },
  { icon: Workflow, title: "Automation Systems", body: "Design reliable operational automations with human control at important decisions." },
  { icon: Layers3, title: "Platforms & Applications", body: "Build connected tools that belong to one governed AIRA product ecosystem." },
  { icon: Boxes, title: "Prototype to Product", body: "Move from a tested problem and working prototype toward a maintainable product." }
];

export default function AiraLabsLandingPage() {
  return (
    <main className="bg-white text-[#101713]">
      <header className="absolute inset-x-0 top-0 z-30 border-b border-white/15 bg-black/15 text-white backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/aira-labs" className="flex items-center gap-3 font-black" aria-label="AIRA Labs home"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e52b2f]"><FlaskConical className="h-5 w-5" /></span><span>AIRA LABS</span></Link>
          <nav className="flex items-center gap-2" aria-label="Account navigation">
            <Button asChild variant="secondary" className="h-10 border-white/25 bg-white/10 px-4 text-sm text-white hover:bg-white hover:text-black"><Link href="/aira-labs/sign-in">Sign in</Link></Button>
            <Button asChild className="h-10 px-4 text-sm"><Link href="/aira-labs/sign-up">Sign up</Link></Button>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[92svh] items-end overflow-hidden bg-black text-white">
        <Image src="/aira-labs/hero-lab.png" alt="A product team building software and connected prototypes inside AIRA Labs" fill priority sizes="100vw" className="object-cover object-[62%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,8,0.96)_0%,rgba(5,10,8,0.78)_34%,rgba(5,10,8,0.18)_70%,rgba(5,10,8,0.12)_100%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-36 sm:px-8 sm:pb-20 lg:pb-24">
          <p className="flex items-center gap-2 text-sm font-black uppercase text-[#75e3da]"><Sparkles className="h-4 w-4" />AIRA Skill City product division</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.96] sm:text-7xl lg:text-8xl">AIRA Labs</h1>
          <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-white/78 sm:text-xl">Learn how intelligent products are imagined, validated, built and brought into the real world.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/aira-labs/sign-up">Create account <ArrowRight className="h-5 w-5" /></Link></Button>
            <Button asChild size="lg" variant="secondary" className="border-white/25 bg-white/10 text-white hover:bg-white hover:text-black"><Link href="/aira-labs/sign-in">Open dashboard</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#dff7f3]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-[0.7fr_1.3fr] md:items-center">
          <p className="text-sm font-black uppercase text-[#b51f27]">Build what matters</p>
          <p className="text-2xl font-black leading-9 sm:text-3xl">A product lab for practical AI, useful software and founders who want to move from an idea to evidence.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl"><p className="text-sm font-black uppercase text-[#b51f27]">What happens here</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">One path from problem to product.</h2></div>
        <div className="mt-12 grid border-y border-black/10 md:grid-cols-2">
          {capabilities.map((item, index) => <article key={item.title} className={`min-h-56 p-7 sm:p-9 ${index % 2 === 0 ? "md:border-r" : ""} ${index < 2 ? "border-b" : ""} border-black/10`}><item.icon className="h-8 w-8 text-[#e52b2f]" /><h3 className="mt-8 text-2xl font-black">{item.title}</h3><p className="mt-3 max-w-md font-semibold leading-7 text-[#58645e]">{item.body}</p></article>)}
        </div>
      </section>

      <section className="bg-[#111814] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div><p className="text-sm font-black uppercase text-[#75e3da]">Your Labs account</p><h2 className="mt-3 text-4xl font-black sm:text-5xl">One place to apply, enquire and follow progress.</h2><p className="mt-5 max-w-xl font-semibold leading-7 text-white/65">Create your personal mobile account and continue every AIRA Labs interaction from your dashboard.</p></div>
          <div className="grid gap-5 border-l border-white/15 pl-6 sm:pl-10">
            <p className="flex gap-4 font-bold"><ShieldCheck className="h-6 w-6 shrink-0 text-[#75e3da]" />Verified personal identity</p>
            <p className="flex gap-4 font-bold"><Bot className="h-6 w-6 shrink-0 text-[#75e3da]" />Application and enquiry status</p>
            <p className="flex gap-4 font-bold"><FlaskConical className="h-6 w-6 shrink-0 text-[#75e3da]" />A growing home for Labs services</p>
            <Button asChild size="lg" className="mt-3 w-fit"><Link href="/aira-labs/sign-up">Get started <ArrowRight className="h-5 w-5" /></Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-[#f4f6f3]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm font-semibold text-[#58645e] sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>AIRA Labs, an AIRA Skill City division.</p><Link href="https://airaskillcity.com" className="font-bold text-[#b51f27]">Visit AIRA Skill City</Link></div>
      </footer>
    </main>
  );
}
