import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeadAssignmentForm, LeadFollowUpForm } from "@/features/crm/components/lead-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getScopedLeadDetail } from "@/server/crm/queries";

function formatDate(value?: Date | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(value) : "Not set";
}

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const { lead, assignees } = await getScopedLeadDetail(leadId);
  if (!lead) notFound();

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost"><Link href="/admissions/leads"><ArrowLeft className="h-4 w-4" />Back to leads</Link></Button>
      <DirectorPageHeader eyebrow={lead.pipelineStage.name} title={lead.name} description="Scoped CRM record, follow-ups, applications, counselling, and activity history." />
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card><CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs font-black uppercase text-brand-muted">Phone</p><p className="mt-1 font-black">{lead.phone}</p></div>
            <div><p className="text-xs font-black uppercase text-brand-muted">Program</p><p className="mt-1 font-black">{lead.programInterested?.name ?? "Not selected"}</p></div>
            <div><p className="text-xs font-black uppercase text-brand-muted">Source</p><p className="mt-1 font-black">{lead.source?.name ?? "Not captured"}</p></div>
            <div><p className="text-xs font-black uppercase text-brand-muted">Owner</p><p className="mt-1 font-black">{lead.assignedTo?.name ?? "Unassigned"}</p></div>
          </CardContent></Card>
          <Card><CardContent className="p-6"><h2 className="text-xl font-black">Applications and counselling</h2><div className="mt-4 space-y-3">
            {lead.applications.map((application) => <Link key={application.id} href={`/admissions/applications/${application.id}`} className="block rounded-lg bg-white p-4 font-bold">{application.program.name} - {application.status}</Link>)}
            {lead.counsellingSessions.map((session) => <div key={session.id} className="rounded-lg bg-white p-4"><p className="font-bold">{session.outcome}</p><p className="text-sm text-brand-muted">{formatDate(session.scheduledAt)} - {session.counsellor?.name ?? "Unassigned"}</p></div>)}
            {!lead.applications.length && !lead.counsellingSessions.length ? <p className="text-brand-muted">No application or counselling record yet.</p> : null}
          </div></CardContent></Card>
          <Card><CardContent className="p-6"><h2 className="text-xl font-black">Timeline</h2><div className="mt-4 space-y-3">
            {lead.activities.map((activity) => <div key={activity.id} className="rounded-lg bg-white p-4"><p className="font-bold">{activity.type.replaceAll("_", " ")}</p><p className="text-sm text-brand-muted">{formatDate(activity.createdAt)} by {activity.actor?.name ?? "System"}</p><p className="mt-2 text-sm">{activity.summary}</p></div>)}
          </div></CardContent></Card>
        </div>
        <div className="space-y-5">
          <Card><CardContent className="p-6"><h2 className="mb-4 text-xl font-black">Assignment</h2><LeadAssignmentForm leadId={lead.id} assignedToId={lead.assignedToId} assignees={assignees} /></CardContent></Card>
          <Card><CardContent className="p-6"><h2 className="mb-4 text-xl font-black">Follow-up</h2><LeadFollowUpForm leadId={lead.id} /></CardContent></Card>
          <Card><CardContent className="p-6"><h2 className="text-xl font-black">Scheduled follow-ups</h2><div className="mt-4 space-y-3">
            {lead.communicationLogs.filter((item) => item.status === "SCHEDULED").map((item) => <div key={item.id} className="rounded-lg bg-white p-4"><p className="font-bold">{item.subject ?? "Follow-up"}</p><p className="text-sm text-brand-muted">{formatDate(item.scheduledAt)}</p></div>)}
          </div></CardContent></Card>
        </div>
      </section>
    </div>
  );
}
