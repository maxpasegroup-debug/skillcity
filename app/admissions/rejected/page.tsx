import { XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";

export default async function RejectedAdmissionsPage() {
  const applications = await prisma.admissionApplication.findMany({
    where: { status: "REJECTED" },
    orderBy: { reviewedAt: "desc" },
    include: { lead: { include: { leadNotes: { orderBy: { createdAt: "desc" }, take: 1 } } }, program: true }
  });

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admissions" title="Rejected applications" description="Applications that are not moving forward. Notes remain available for future reference." />
      <div className="grid gap-5 lg:grid-cols-2">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardContent className="p-6">
              <XCircle className="h-8 w-8 text-brand-red" />
              <p className="mt-5 text-sm font-black text-brand-red">REJECTED</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">{application.lead.name}</h2>
              <p className="mt-2 font-bold text-brand-muted">{application.program.name}</p>
              <p className="mt-4 text-sm font-semibold leading-6 text-brand-muted">{application.lead.leadNotes[0]?.note ?? "No review note added."}</p>
            </CardContent>
          </Card>
        ))}
        {applications.length === 0 ? <p className="font-semibold text-brand-muted">No rejected applications yet.</p> : null}
      </div>
    </div>
  );
}
