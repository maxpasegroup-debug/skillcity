import Link from "next/link";
import { ArrowRight, MessageCircle, PhoneCall, UserCheck } from "lucide-react";
import { assignCounsellingToMeAction } from "@/actions/counsellor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { candidateWhatsAppUrl } from "@/features/telecaller/components/lead-card";

type Candidate = {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  status: string;
  pipelineStage: { name: string };
  programInterested?: { name: string } | null;
  source?: { name: string } | null;
  assignedTo?: { name: string } | null;
  activities: { createdAt: Date; type: string; summary: string }[];
  applications: { status: string; program: { name: string } }[];
  counsellingSessions: { scheduledAt: Date; outcome: string; counsellor?: { name: string } | null }[];
  communicationLogs: { scheduledAt?: Date | null; subject?: string | null }[];
};

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function nextActionFor(candidate: Candidate) {
  const followUp = candidate.communicationLogs.find((log) => log.subject === "Counsellor follow-up" && log.scheduledAt)?.scheduledAt;
  if (followUp) return { label: "Follow up", due: followUp };
  if (candidate.pipelineStage.name === "Counselling Scheduled") return { label: "Conduct counselling", due: candidate.counsellingSessions[0]?.scheduledAt };
  if (candidate.pipelineStage.name === "Qualified") return { label: "Complete decision", due: null };
  if (candidate.applications[0]?.status === "DRAFT") return { label: "Request application", due: null };
  return { label: "Review candidate", due: null };
}

export function CounsellorCandidateCard({ candidate }: { candidate: Candidate }) {
  const program = candidate.programInterested?.name ?? candidate.applications[0]?.program.name ?? "Program not selected";
  const counselling = candidate.counsellingSessions[0];
  const lastContact = candidate.activities[0]?.createdAt;
  const nextAction = nextActionFor(candidate);

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brand-red">{candidate.pipelineStage.name}</p>
            <h2 className="mt-1 text-2xl font-black text-brand-dark">{candidate.name}</h2>
            <p className="mt-1 text-sm font-bold text-brand-muted">{candidate.city || "City pending"}{candidate.state ? `, ${candidate.state}` : ""}</p>
          </div>
          <div className="rounded-lg bg-brand-card px-4 py-2 text-right">
            <p className="text-xs font-black uppercase text-brand-muted">Next action</p>
            <p className="font-black text-brand-dark">{nextAction.label}</p>
            <p className="text-xs font-bold text-brand-muted">{formatDate(nextAction.due)}</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm font-bold text-brand-muted md:grid-cols-2 xl:grid-cols-4">
          <p>Phone: <span className="text-brand-dark">{candidate.phone}</span></p>
          <p>WhatsApp: <span className="text-brand-dark">{candidate.whatsapp ?? candidate.phone}</span></p>
          <p>Program: <span className="text-brand-dark">{program}</span></p>
          <p>Source: <span className="text-brand-dark">{candidate.source?.name ?? "Unknown"}</span></p>
          <p>Counsellor: <span className="text-brand-dark">{candidate.assignedTo?.name ?? counselling?.counsellor?.name ?? "Unassigned"}</span></p>
          <p>Counselling: <span className="text-brand-dark">{formatDate(counselling?.scheduledAt)}</span></p>
          <p>Last contact: <span className="text-brand-dark">{formatDate(lastContact)}</span></p>
          <p>Status: <span className="text-brand-dark">{candidate.status}</span></p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/counsellor/leads/${candidate.id}`}>
              Open
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <a href={`tel:${candidate.phone}`} aria-label={`Call ${candidate.name}`}>
              <PhoneCall className="h-4 w-4" />
              Call
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href={candidateWhatsAppUrl(candidate)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${candidate.name}`}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          {!candidate.assignedTo ? (
            <form action={assignCounsellingToMeAction}>
              <input type="hidden" name="leadId" value={candidate.id} />
              <Button variant="ghost">
                <UserCheck className="h-4 w-4" />
                Counsel
              </Button>
            </form>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
