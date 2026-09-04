import Link from "next/link";
import type React from "react";
import type { ApplicationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationForm } from "@/features/admissions/components/admission-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionData, getAdmissionsOperationalLists } from "@/server/admissions/queries";

type Props = { searchParams: Promise<{ program?: string; status?: string; q?: string }> };

const applicationStatuses: ApplicationStatus[] = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"];

export default async function ApplicationsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = applicationStatuses.includes(params.status as ApplicationStatus) ? params.status as ApplicationStatus : undefined;
  const [{ leads, programs }, [applications]] = await Promise.all([getAdmissionData(), getAdmissionsOperationalLists({ program: params.program, status, q: params.q })]);
  const priorityPrograms = programs.filter((program) => program.slug === "startup-skool" || program.slug === "aira-labs");

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Applications" title="Admission applications" description="Program applications from Nexa flow into this Admission Cell queue." />
      <Card>
        <CardContent className="p-6">
          <ApplicationForm leads={leads} programs={programs} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <form className="grid gap-4 md:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-brand-dark">Search</span>
              <input name="q" defaultValue={params.q ?? ""} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-brand-dark" />
            </label>
            <Select name="program" label="Program" defaultValue={params.program ?? ""}>
              <option value="">All programs</option>
              {priorityPrograms.map((program) => <option key={program.id} value={program.slug}>{program.name}</option>)}
              {programs.filter((program) => !priorityPrograms.some((priority) => priority.id === program.id)).map((program) => <option key={program.id} value={program.slug}>{program.name}</option>)}
            </Select>
            <Select name="status" label="Status" defaultValue={status ?? ""}>
              <option value="">All statuses</option>
              {applicationStatuses.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </Select>
            <div className="flex items-end">
              <Button className="w-full">Filter Applications</Button>
            </div>
          </form>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant={params.program === "startup-skool" ? "primary" : "secondary"}>
              <Link href="/admissions/applications?program=startup-skool">Startup Skool</Link>
            </Button>
            <Button asChild variant={params.program === "aira-labs" ? "primary" : "secondary"}>
              <Link href="/admissions/applications?program=aira-labs">AIRA Labs</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admissions/applications">Clear</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {applications.map((app) => (
          <Card key={app.id} className={app.program.slug === "startup-skool" || app.program.slug === "aira-labs" ? "border-brand-gold/35" : undefined}>
            <CardContent className="p-6">
              <p className="text-sm font-black text-brand-red">{app.status} - {app.program.slug === "aira-labs" ? "AIRA LABS" : app.program.slug === "startup-skool" ? "STARTUP SKOOL" : "ADMISSIONS"}</p>
              <h3 className="mt-2 text-2xl font-black text-brand-dark">{app.lead.name}</h3>
              <p className="mt-2 font-bold text-brand-muted">{app.program.name} - {app.documents.length} documents</p>
              <p className="mt-2 text-sm font-bold text-brand-muted">{app.lead.whatsapp ?? app.lead.phone ?? "No phone"} - {app.lead.city ?? "City pending"}</p>
              <Button asChild className="mt-5">
                <Link href={`/admissions/applications/${app.id}`}>Open admission flow</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Select({ name, label, children, defaultValue }: { name: string; label: string; children: React.ReactNode; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">
        {children}
      </select>
    </label>
  );
}
