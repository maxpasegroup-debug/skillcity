import { KeyRound, MessageCircle, Timer } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";

export const dynamic = "force-dynamic";

export default async function AdminAccessPage() {
  const [credentials, messages] = await Promise.all([
    prisma.studentLoginCredential.findMany({
      orderBy: { updatedAt: "desc" },
      take: 80,
      include: { user: true, application: { include: { lead: true, program: true } }, generatedBy: true }
    }),
    prisma.whatsAppMessageLog.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { application: { include: { lead: true, program: true } }, user: true } })
  ]);
  const active = credentials.filter((item) => item.status === "ACTIVE" && !item.revokedAt);
  const resetPending = active.filter((item) => item.mustResetPin || item.temporary);
  const ready = active.filter((item) => !item.mustResetPin && !item.temporary);

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admin" title="Student access" description="Monitor WhatsApp PIN credentials, temporary PIN reset status and welcome message delivery." />
      <section className="grid gap-5 sm:grid-cols-3">
        <DirectorMetricCard label="Ready Logins" value={ready.length} icon={KeyRound} />
        <DirectorMetricCard label="Reset Pending" value={resetPending.length} icon={Timer} />
        <DirectorMetricCard label="WhatsApp Messages" value={messages.length} icon={MessageCircle} />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Credentials</h2>
            <div className="mt-5 space-y-3">
              {credentials.length === 0 ? (
                <p className="font-semibold text-brand-muted">No student login credentials generated yet.</p>
              ) : (
                credentials.map((credential) => (
                  <div key={credential.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{credential.user.name}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{credential.application?.program.name ?? "Program pending"} - {credential.whatsapp}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">
                      {credential.status} {credential.mustResetPin ? "- reset pending" : "- ready"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Message Log</h2>
            <div className="mt-5 space-y-3">
              {messages.length === 0 ? (
                <p className="font-semibold text-brand-muted">No WhatsApp messages prepared yet.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{message.application?.lead.name ?? message.user?.name ?? message.to}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{message.status} - {message.provider ?? "Provider"} - {message.to}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
