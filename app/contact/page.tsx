import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Contact Admissions", description: "Contact AIRA Skill City admissions office by WhatsApp, email or enquiry form." };

export default function ContactPage() {
  return <main className="skillcity-shell-bg text-brand-dark"><Navbar /><section className="px-5 py-16 sm:px-8 lg:px-10"><Container className="grid gap-8 lg:grid-cols-[1fr_420px]"><div><p className="text-sm font-black uppercase text-brand-red">Admissions Office</p><h1 className="mt-4 text-5xl font-black text-brand-dark md:text-7xl">Talk to AIRA Skill City.</h1><p className="mt-6 text-xl leading-9 text-brand-muted">Get help choosing Startup Skool, GenZ Builder - Vibe Coding or the NiceJobs Sales Mastery free internship.</p><div className="mt-10 grid gap-5 md:grid-cols-2"><ContactCard icon={MessageCircle} title="WhatsApp" value="Shared after application submission" /><ContactCard icon={Mail} title="Email" value="admissions@airaskillcity.com" /><ContactCard icon={Phone} title="Quick Call" value="Request through the application form" /><ContactCard icon={MapPin} title="Office Hours" value="10 AM to 6 PM, Monday to Saturday" /></div><Card className="mt-5"><CardContent className="p-6"><h2 className="text-2xl font-black text-brand-dark">Training Centre Visit</h2><p className="mt-3 font-bold text-brand-muted">Location details are shared with shortlisted applicants during counselling.</p></CardContent></Card></div><Card><CardContent className="p-6"><h2 className="text-2xl font-black text-brand-dark">Enquiry Form</h2><form className="mt-6 space-y-4"><Input label="Name" name="name" /><Input label="Phone" name="phone" /><Input label="Email" name="email" type="email" /><Input label="Program Interested" name="program" /><Button asChild className="w-full"><Link href="/apply">Apply Now</Link></Button><Button asChild className="w-full" variant="secondary"><Link href="/application-status">Check Application Status</Link></Button></form></CardContent></Card></Container></section><Footer /></main>;
}

function ContactCard({ icon: Icon, title, value }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string }) {
  return <Card><CardContent className="flex min-h-32 gap-4 p-5"><Icon className="h-6 w-6 text-brand-red" /><div><h2 className="font-black text-brand-dark">{title}</h2><p className="mt-2 font-bold text-brand-muted">{value}</p></div></CardContent></Card>;
}
