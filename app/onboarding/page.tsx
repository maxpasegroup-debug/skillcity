import type { Metadata } from "next";
import { ArrowDown, BadgeCheck } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Student Onboarding", description: "Welcome journey from profile completion to Day 1." };

const steps = ["Welcome", "Complete Profile", "Upload Documents", "Join Community", "Meet Tara", "View Batch", "Start Day 1"];

export default function OnboardingPage() {
  return <main className="skillcity-shell-bg text-brand-dark"><Navbar /><section className="px-5 py-16 sm:px-8 lg:px-10"><Container><p className="text-sm font-black uppercase text-brand-red">Student Onboarding</p><h1 className="mt-4 text-5xl font-black text-brand-dark md:text-7xl">A calm first week.</h1><p className="mt-6 max-w-3xl text-xl leading-9 text-brand-muted">Students move from admission confirmation to Day 1 with simple steps and no confusion.</p><div className="mt-10 grid gap-4">{steps.map((step, index) => <div key={step}><Card><CardContent className="flex items-center gap-5 p-6"><BadgeCheck className="h-7 w-7 text-brand-red" /><h2 className="text-2xl font-black text-brand-dark">{step}</h2></CardContent></Card>{index < steps.length - 1 ? <ArrowDown className="mx-auto my-3 h-6 w-6 text-brand-red" /> : null}</div>)}</div></Container></section><Footer /></main>;
}
