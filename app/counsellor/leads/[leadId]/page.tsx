import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CounsellingDecisionForm } from "@/features/counsellor/components/counselling-decision-form";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { candidateWhatsAppUrl } from "@/features/telecaller/components/lead-card";
import { getCounsellorLeadDetail, getCounsellorWorkspace, requireCounsellorUser } from "@/server/admissions/queries";

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

export default async function CounsellorLeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const user = await requireCounsellorUser();
  const [lead, workspace] = await Promise.all([
    getCounsellorLeadDetail({ user, leadId }),
    getCounsellorWorkspace({ user })
  ]);

  if (!lead) notFound();

  const program = lead.programInterested?.name ?? lead.applications[0]?.program.name ?? "Program not selected";
  const latestCounselling = lead.counsellingSessions[0];
  const telecallerHistory = lead.activities.filter((activity) => activity.type.startsWith("TELECALLER_"));
  const timeline = [...lead.activities].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const nextFollowUp = lead.communicationLogs.find((log) => log.status === "SCHEDULED" && log.subject === "Counsellor follow-up")?.scheduledAt;

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost">
        <Link href="/counsellor">
          <ArrowLeft className="h-4 w-4" />
          Back to queue
        </Link>
      </Button>

      <DirectorPageHeader eyebrow={lead.pipelineStage.name} title={lead.name} description="Candidate counselling workspace: context, history, counselling decision, application handoff, and next action." />

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={`tel:${lead.phone}`} aria-label={`Call ${lead.name}`}>
            <PhoneCall className="h-4 w-4" />
            Call
          </a>
        </Button>
        <Button asChild variant="secondary">
          <a href={candidateWhatsAppUrl(lead)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${lead.name}`}>
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <DetailRow label="Phone" value={lead.phone} />
          <DetailRow label="WhatsApp" value={lead.whatsapp ?? lead.phone} />
          <DetailRow label="Program" value={program} />
          <DetailRow label="Current Stage" value={lead.pipelineStage.name} />
          <DetailRow label="Counsellor" value={lead.assignedTo?.name ?? latestCounselling?.counsellor?.name ?? "Unassigned"} />
          <DetailRow label="Next Action Due" value={formatDate(nextFollowUp ?? latestCounselling?.nextFollowUpAt)} />
          <DetailRow label="Application" value={lead.applications[0]?.status ?? "No application"} />
          <DetailRow label="Lead Source" value={lead.source?.name} />
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Basic Information</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Name" value={lead.name} />
                <DetailRow label="Email" value={lead.email} />
                <DetailRow label="Location" value={[lead.city, lead.state].filter(Boolean).join(", ")} />
                <DetailRow label="Phone" value={lead.phone} />
                <DetailRow label="WhatsApp" value={lead.whatsapp ?? lead.phone} />
                <DetailRow label="Lead Status" value={lead.status} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Program Interest</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailRow label="Interested Program" value={lead.programInterested?.name} />
                <DetailRow label="Source" value={lead.source?.name} />
                <DetailRow label="Application Status" value={lead.applications[0]?.status ?? "No application"} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Telecaller History</h2>
              <div className="mt-5 space-y-3">
                {telecallerHistory.map((activity) => (
                  <div key={activity.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{activity.type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{formatDate(activity.createdAt)} by {activity.actor?.name ?? "Team"}</p>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">{activity.summary}</p>
                  </div>
                ))}
                {telecallerHistory.length === 0 ? <p className="font-semibold text-brand-muted">No telecaller history yet.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Counselling</h2>
              <div className="mt-5 space-y-3">
                {lead.counsellingSessions.map((session) => (
                  <div key={session.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{session.outcome}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{formatDate(session.scheduledAt)} by {session.counsellor?.name ?? "Unassigned"}</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-brand-muted">{session.notes ?? "No notes captured."}</p>
                  </div>
                ))}
                {lead.counsellingSessions.length === 0 ? <p className="font-semibold text-brand-muted">Counselling not started yet.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Application</h2>
              <div className="mt-5 space-y-3">
                {lead.applications.map((application) => (
                  <div key={application.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{application.program.name}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{application.status} - submitted {formatDate(application.submittedAt)}</p>
                  </div>
                ))}
                {lead.applications.length === 0 ? <p className="font-semibold text-brand-muted">No application has been created yet.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Activity Timeline</h2>
              <div className="mt-5 space-y-3">
                {timeline.map((activity) => (
                  <div key={activity.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{activity.type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{formatDate(activity.createdAt)} by {activity.actor?.name ?? "System"}</p>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">{activity.summary}</p>
                  </div>
                ))}
                {timeline.length === 0 ? <p className="font-semibold text-brand-muted">No activity yet.</p> : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardContent className="p-6">
            <h2 className="text-2xl font-black text-brand-dark">Counsel</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-brand-muted">Capture the useful counselling context, decide the outcome, and set the next action.</p>
            <div className="mt-5">
              <CounsellingDecisionForm leadId={lead.id} programs={workspace.programs} />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
