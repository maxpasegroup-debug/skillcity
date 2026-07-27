import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Email Preview Templates", description: "Frontend-only preview templates for admissions and onboarding notifications." };

const templates = ["Application Received", "Counselling Scheduled", "Admission Approved", "Seat Reserved", "Payment Reminder", "Batch Starts Soon", "Welcome Student"];

export default function EmailPreviewsPage() {
  return <main><Navbar /><section className="px-5 py-16 sm:px-8 lg:px-10"><Container><p className="text-sm font-black uppercase text-brand-red">Notification Preview</p><h1 className="mt-4 text-5xl font-black text-brand-dark md:text-7xl">Admission email templates.</h1><p className="mt-6 max-w-3xl text-xl leading-9 text-brand-muted">Frontend previews only. Backend notification services remain unchanged.</p><div className="mt-10 grid gap-5 lg:grid-cols-2">{templates.map((template) => <Card key={template}><CardContent className="p-6"><div className="flex items-center gap-3 text-brand-red"><Mail className="h-5 w-5" /><p className="font-black">{template}</p></div><h2 className="mt-5 text-2xl font-black text-brand-dark">Hello from SkillCity</h2><p className="mt-3 leading-7 text-brand-muted">This message confirms the next step in your September 5 admission journey. Our admissions team will guide you clearly.</p></CardContent></Card>)}</div></Container></section><Footer /></main>;
}
