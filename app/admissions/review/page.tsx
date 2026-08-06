import type { Prisma } from "@prisma/client";
import { ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { ApplicationReviewForm } from "@/features/admissions/components/admission-cell-forms";

export default async function AdmissionReviewPage() {
  const applications = await prisma.admissionApplication.findMany({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    orderBy: { submittedAt: "asc" },
    include: {
      lead: { include: { leadNotes: { orderBy: { createdAt: "desc" }, take: 2 } } },
      program: true
    }
  });

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admission Cell" title="Review queue" description="Review submitted applications, add notes, and approve or reject admission requests." />
      {applications.length === 0 ? (
        <Card><CardContent className="p-8"><ClipboardCheck className="h-10 w-10 text-brand-red" /><h2 className="mt-5 text-2xl font-black text-brand-dark">No applications waiting.</h2><p className="mt-3 font-semibold text-brand-muted">New public applications will appear here after applicants complete NEXA onboarding.</p></CardContent></Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {applications.map((application) => <ApplicationReviewCard key={application.id} application={application} />)}
        </div>
      )}
    </div>
  );
}

type ReviewApplication = Prisma.AdmissionApplicationGetPayload<{
  include: { lead: { include: { leadNotes: true } }; program: true };
}>;

function ApplicationReviewCard({ application }: { application: ReviewApplication }) {
  const data = application.data as Record<string, string> | null;
  return (
    <Card>
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-black text-brand-red">{application.status}</p>
          <h2 className="mt-2 text-2xl font-black text-brand-dark">{application.lead.name}</h2>
          <p className="mt-2 font-bold text-brand-muted">{application.program.name}</p>
          <div className="mt-5 grid gap-3 text-sm font-semibold text-brand-muted sm:grid-cols-2">
            <p>Phone: {application.lead.phone}</p>
            <p>WhatsApp: {application.lead.whatsapp ?? "Not provided"}</p>
            <p>City: {[application.lead.city, application.lead.state].filter(Boolean).join(", ") || "Not provided"}</p>
            <p>Email: {application.lead.email ?? "Not provided"}</p>
          </div>
          <div className="mt-5 rounded-lg bg-brand-card p-4">
            <p className="text-sm font-black text-brand-dark">Applicant Goal</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-brand-muted">{data?.goal ?? application.lead.notes ?? "No goal captured."}</p>
          </div>
          {application.lead.leadNotes.length > 0 ? (
            <div className="mt-5 space-y-2">
              <p className="text-sm font-black text-brand-dark">Recent Notes</p>
              {application.lead.leadNotes.map((note) => <p key={note.id} className="rounded-lg bg-white text-sm font-semibold leading-6 text-brand-muted">{note.note}</p>)}
            </div>
          ) : null}
        </div>
        <ApplicationReviewForm applicationId={application.id} defaultStatus={application.status} />
      </CardContent>
    </Card>
  );
}
