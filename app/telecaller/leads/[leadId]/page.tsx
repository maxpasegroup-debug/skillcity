import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { candidateWhatsAppUrl } from "@/features/telecaller/components/lead-card";
import { TelecallerOutcomeForm } from "@/features/telecaller/components/telecaller-outcome-form";
import { getTelecallerLeadDetail, requireTelecallerUser } from "@/server/admissions/queries";

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-1 font-black text-brand-dark">{value || "Not provided"}</p>
    </div>
  );
}

export default async function TelecallerLeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const user = await requireTelecallerUser();
  const lead = await getTelecallerLeadDetail({ user, leadId });

  if (!lead) notFound();

  const program = lead.programInterested?.name ?? lead.applications[0]?.program.name ?? "Program not selected";
  const whatsappUrl = candidateWhatsAppUrl(lead);
  const nextFollowUp = lead.communicationLogs.find((log) => log.status === "SCHEDULED" && log.scheduledAt)?.scheduledAt;
  const callHistory = lead.activities.filter((activity) => activity.type.startsWith("TELECALLER_"));

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost">
        <Link href="/telecaller">
          <ArrowLeft className="h-4 w-4" />
          Back to queue
        </Link>
      </Button>

      <DirectorPageHeader eyebrow={lead.pipelineStage.name} title={lead.name} description="Telecaller view with only the candidate details, contact history, notes, follow-up, and pipeline context needed to act fast." />

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={`tel:${lead.phone}`} aria-label={`Call ${lead.name}`}>
            <PhoneCall className="h-4 w-4" />
            Call
          </a>
        </Button>
        <Button asChild variant="secondary">
          <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${lead.name}`}>
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
              <DetailRow label="Candidate" value={lead.name} />
              <DetailRow label="Program Interest" value={program} />
              <DetailRow label="Phone" value={lead.phone} />
              <DetailRow label="WhatsApp" value={lead.whatsapp ?? lead.phone} />
              <DetailRow label="Email" value={lead.email} />
              <DetailRow label="Location" value={[lead.city, lead.state].filter(Boolean).join(", ")} />
              <DetailRow label="Lead Source" value={lead.source?.name} />
              <DetailRow label="Application Status" value={lead.applications[0]?.status ?? "No application"} />
              <DetailRow label="Current Stage" value={lead.pipelineStage.name} />
              <DetailRow label="Assigned Telecaller" value={lead.assignedTo?.name ?? "Unassigned"} />
              <DetailRow label="Last Contact" value={formatDate(callHistory[0]?.createdAt ?? lead.activities[0]?.createdAt)} />
              <DetailRow label="Next Follow-up" value={formatDate(nextFollowUp)} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Communication History</h2>
              <div className="mt-5 space-y-3">
                {lead.communicationLogs.map((log) => (
                  <div key={log.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{log.subject ?? log.channel}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{log.channel} - {log.status} - {formatDate(log.scheduledAt ?? log.sentAt ?? log.updatedAt)}</p>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">{log.message}</p>
                  </div>
                ))}
                {lead.communicationLogs.length === 0 ? <p className="font-semibold text-brand-muted">No communication records yet.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Call History</h2>
              <div className="mt-5 space-y-3">
                {callHistory.map((activity) => (
                  <div key={activity.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{activity.type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{formatDate(activity.createdAt)} by {activity.actor?.name ?? "System"}</p>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">{activity.summary}</p>
                  </div>
                ))}
                {callHistory.length === 0 ? <p className="font-semibold text-brand-muted">No telecaller calls recorded yet.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Notes</h2>
              <div className="mt-5 space-y-3">
                {lead.leadNotes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-white p-4">
                    <p className="text-sm font-bold text-brand-muted">{formatDate(note.createdAt)} by {note.author?.name ?? "Team"}</p>
                    <p className="mt-2 leading-7 text-brand-dark">{note.note}</p>
                  </div>
                ))}
                {lead.leadNotes.length === 0 ? <p className="font-semibold text-brand-muted">No notes yet.</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Record outcome</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-brand-muted">Save what happened, set a follow-up if needed, or send this lead to the counsellor queue.</p>
            <div className="mt-5">
              <TelecallerOutcomeForm leadId={lead.id} />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
