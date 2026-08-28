import Link from "next/link";
import { ArrowRight, MessageCircle, PhoneCall, UserPlus } from "lucide-react";
import { assignLeadToMeAction } from "@/actions/telecaller";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TelecallerOutcomeForm } from "./telecaller-outcome-form";

type LeadCardInput = {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  city?: string | null;
  state?: string | null;
  status: string;
  updatedAt: Date;
  pipelineStage: { name: string };
  programInterested?: { name: string } | null;
  source?: { name: string } | null;
  assignedTo?: { name: string } | null;
  activities: { createdAt: Date; type: string; summary: string }[];
  applications: { status: string; program: { name: string } }[];
  communicationLogs: { scheduledAt?: Date | null; subject?: string | null }[];
};

function cleanPhone(value?: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function candidateWhatsAppUrl(lead: { name: string; whatsapp?: string | null; phone: string; programInterested?: { name: string } | null }) {
  const phone = cleanPhone(lead.whatsapp || lead.phone);
  const program = lead.programInterested?.name ?? "AIRA Skill City";
  const message = `Hi ${lead.name}, this is AIRA Skill City Admissions. I am contacting you about your interest in ${program}.`;
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#";
}

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function LeadCard({ lead }: { lead: LeadCardInput }) {
  const lastContact = lead.activities[0]?.createdAt;
  const nextFollowUp = lead.communicationLogs.find((log) => log.scheduledAt)?.scheduledAt;
  const whatsappUrl = candidateWhatsAppUrl(lead);

  return (
    <Card>
      <CardContent className="grid gap-5 p-5 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-brand-red">{lead.pipelineStage.name}</p>
              <h2 className="mt-1 text-2xl font-black text-brand-dark">{lead.name}</h2>
              <p className="mt-1 text-sm font-bold text-brand-muted">{lead.city || "City pending"}{lead.state ? `, ${lead.state}` : ""}</p>
            </div>
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-black text-brand-muted">{lead.status}</span>
          </div>

          <div className="grid gap-3 text-sm font-bold text-brand-muted sm:grid-cols-2 xl:grid-cols-3">
            <p>Phone: <span className="text-brand-dark">{lead.phone}</span></p>
            <p>WhatsApp: <span className="text-brand-dark">{lead.whatsapp ?? lead.phone}</span></p>
            <p>Program: <span className="text-brand-dark">{lead.programInterested?.name ?? lead.applications[0]?.program.name ?? "Not selected"}</span></p>
            <p>Source: <span className="text-brand-dark">{lead.source?.name ?? "Unknown"}</span></p>
            <p>Last contact: <span className="text-brand-dark">{formatDate(lastContact)}</span></p>
            <p>Next follow-up: <span className="text-brand-dark">{formatDate(nextFollowUp)}</span></p>
            <p>Assigned: <span className="text-brand-dark">{lead.assignedTo?.name ?? "Unassigned"}</span></p>
            <p>Application: <span className="text-brand-dark">{lead.applications[0]?.status ?? "No application"}</span></p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="md">
              <a href={`tel:${lead.phone}`} aria-label={`Call ${lead.name}`}>
                <PhoneCall className="h-4 w-4" />
                Call
              </a>
            </Button>
            <Button asChild variant="secondary" size="md">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${lead.name}`}>
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href={`/telecaller/leads/${lead.id}`}>
                View
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!lead.assignedTo ? (
              <form action={assignLeadToMeAction}>
                <input type="hidden" name="leadId" value={lead.id} />
                <Button variant="ghost" size="md" aria-label={`Assign ${lead.name} to me`}>
                  <UserPlus className="h-4 w-4" />
                  Assign me
                </Button>
              </form>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-brand-card/70 p-4">
          <TelecallerOutcomeForm leadId={lead.id} compact />
        </div>
      </CardContent>
    </Card>
  );
}
