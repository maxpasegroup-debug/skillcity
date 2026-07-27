import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Admission Process", description: "Visual admission journey from application to student dashboard activation." };

const steps = ["Application", "Counselling Booking", "Admission Review", "Offer", "INR 20,000 Seat Booking", "Admission Confirmed", "Balance Reminder", "Student Dashboard Activated"];

export default function AdmissionProcessPage() {
  return <main><Navbar /><section className="px-5 py-16 sm:px-8 lg:px-10"><Container><p className="text-sm font-black uppercase text-brand-red">Admissions</p><h1 className="mt-4 text-5xl font-black text-brand-dark md:text-7xl">From enquiry to Day 1.</h1><p className="mt-6 max-w-3xl text-xl leading-9 text-brand-muted">A clear seat-booking journey for the September 5 launch batch.</p><div className="mt-10 grid gap-5 md:grid-cols-2">{steps.map((step, index) => <Card key={step}><CardContent className="flex min-h-28 items-center gap-5 p-6"><div className="grid h-12 w-12 place-items-center rounded-lg bg-brand-beige text-brand-red"><CheckCircle2 className="h-6 w-6" /></div><div><p className="text-sm font-black text-brand-red">Step {index + 1}</p><h2 className="text-2xl font-black text-brand-dark">{step}</h2></div></CardContent></Card>)}</div></Container></section><Footer /></main>;
}
