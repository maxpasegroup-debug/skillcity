import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { AdmissionProgramForm } from "@/features/admissions/components/admission-cell-forms";

export default async function AdmissionProgramsPage() {
  const programs = await prisma.program.findMany({
    where: { deletedAt: null },
    orderBy: [{ displayOrder: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { leads: true, admissionApplications: true } } }
  });

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admission Cell" title="Program management" description="Add, edit, open, close, waitlist and publish programs for admissions without developer changes." />
      <Card><CardContent className="p-6 md:p-8"><AdmissionProgramForm /></CardContent></Card>
      <section className="grid gap-5 lg:grid-cols-2">
        {programs.map((program) => (
          <Card key={program.id}>
            <CardContent className="p-6">
              <BookOpen className="h-7 w-7 text-brand-red" />
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black text-brand-dark">{program.status}</span>
                <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black text-brand-dark">{program.admissionStatus}</span>
                <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black text-brand-dark">{program.feeType}</span>
                <span className="rounded-full bg-brand-beige px-3 py-1 text-xs font-black text-brand-dark">{program.publicVisible ? "PUBLIC" : "HIDDEN"}</span>
              </div>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">{program.name}</h2>
              <p className="mt-1 text-sm font-black text-brand-red">{program.category ?? "Uncategorized"} · Order {program.displayOrder}</p>
              <p className="mt-3 line-clamp-3 text-sm font-semibold leading-6 text-brand-muted">{program.description}</p>
              <div className="mt-5 grid gap-3 text-sm font-bold text-brand-muted sm:grid-cols-3">
                <p>{program.durationDays} days</p>
                <p>{program._count.leads} leads</p>
                <p>{program._count.admissionApplications} applications</p>
              </div>
              <details className="mt-6 rounded-lg border border-black/8 bg-brand-card p-4">
                <summary className="cursor-pointer text-sm font-black text-brand-dark">Edit Program</summary>
                <div className="mt-5 rounded-lg bg-white p-4">
                  <AdmissionProgramForm program={program} />
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
