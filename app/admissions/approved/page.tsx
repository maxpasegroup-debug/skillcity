import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";

export default async function ApprovedAdmissionsPage() {
  const applications = await prisma.admissionApplication.findMany({
    where: { status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
    include: {
      lead: true,
      program: true,
      studentLoginCredentials: { orderBy: { createdAt: "desc" }, take: 1 },
      whatsAppMessageLogs: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admissions" title="Approved admissions" description="Generate WhatsApp PIN access only for approved applicants. Students reset the temporary PIN before their dashboard opens." />
      <div className="grid gap-5 lg:grid-cols-2">
        {applications.map((application) => {
          const credential = application.studentLoginCredentials[0];
          const message = application.whatsAppMessageLogs[0];
          const whatsapp = credential?.whatsapp ?? application.lead.whatsapp ?? application.lead.phone;

          return (
            <Card key={application.id}>
              <CardContent className="p-6">
                <CheckCircle2 className="h-8 w-8 text-brand-red" />
                <p className="mt-5 text-sm font-black text-brand-red">APPROVED</p>
                <h2 className="mt-2 text-2xl font-black text-brand-dark">{application.lead.name}</h2>
                <p className="mt-2 font-bold text-brand-muted">{application.program.name}</p>
                <div className="mt-4 grid gap-3 rounded-lg bg-brand-card p-4 text-sm font-semibold text-brand-muted">
                  <p>WhatsApp: {whatsapp}</p>
                  <p>Login: {credential ? `${credential.status}${credential.mustResetPin ? " - PIN reset required" : ""}` : "Not generated"}</p>
                  <p>Last message: {message ? `${message.status} through ${message.provider ?? "provider"}` : "No WhatsApp message yet"}</p>
                </div>
                <Button asChild className="mt-5 w-full">
                  <Link href={`/admissions/applications/${application.id}`}>Open payment and activation flow</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {applications.length === 0 ? <p className="font-semibold text-brand-muted">No approved admissions yet.</p> : null}
      </div>
    </div>
  );
}
