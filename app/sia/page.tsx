import Link from "next/link";
import { ArrowRight, Bell, Bot, CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { PageHeader } from "@/components/ui/page-header";
import { ProposalReviewForm } from "@/features/sia/components/proposal-review-form";
import { getSiaOperatingBriefing } from "@/server/sia/briefing";

export const dynamic = "force-dynamic";

export default async function SiaOperatingCentrePage() {
  const data = await getSiaOperatingBriefing();
  const generatedAt = new Date();

  return (
    <main className="skillcity-shell-bg min-h-screen py-8 text-brand-dark sm:py-10">
      <Container>
        <header className="mb-8 flex flex-col gap-4 border-b border-black/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/workspace" aria-label="My workspaces"><Logo /></Link>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><Link href="/communications/channels"><MessageSquare className="h-4 w-4" />Channels</Link></Button>
            <Button asChild variant="secondary"><Link href="/notifications"><Bell className="h-4 w-4" />Notifications</Link></Button>
            <Button asChild variant="secondary"><Link href="/workspace">Workspaces</Link></Button>
          </div>
        </header>

        <PageHeader title="SIA Operating Centre" subtitle={`A live, permission-scoped operating brief for ${data.actor.name}. Updated ${generatedAt.toLocaleString()}.`} />

        <section className="grid gap-4 md:grid-cols-3" aria-label="Personal operating summary">
          <Card><CardContent className="p-5"><Bell className="h-5 w-5 text-brand-red" /><p className="mt-3 text-xs font-black uppercase text-brand-muted">Unread notifications</p><p className="mt-1 text-3xl font-black">{data.unreadNotifications}</p></CardContent></Card>
          <Card><CardContent className="p-5"><MessageSquare className="h-5 w-5 text-brand-red" /><p className="mt-3 text-xs font-black uppercase text-brand-muted">Active channels</p><p className="mt-1 text-3xl font-black">{data.channelMemberships}</p></CardContent></Card>
          <Card><CardContent className="p-5"><ShieldCheck className="h-5 w-5 text-brand-red" /><p className="mt-3 text-xs font-black uppercase text-brand-muted">Proposals awaiting you</p><p className="mt-1 text-3xl font-black">{data.proposals.length}</p></CardContent></Card>
        </section>

        <section className="mt-10" aria-labelledby="briefing-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black uppercase text-brand-red">Daily brief</p><h2 id="briefing-heading" className="mt-1 text-2xl font-black">Authorized operating areas</h2></div>{data.assistant ? <Button asChild><Link href={data.assistant.href}><Bot className="h-4 w-4" />Ask SIA</Link></Button> : null}</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.areas.map((area) => <Card key={area.key}><CardContent className="flex h-full flex-col p-5"><p className="text-sm font-black text-brand-muted">{area.label}</p><p className="mt-3 text-3xl font-black">{area.count}</p><p className="mt-1 flex-1 text-sm font-semibold text-brand-muted">{area.metric}</p><Link href={area.href} className="mt-5 inline-flex items-center gap-2 font-bold text-brand-red">Open workspace <ArrowRight className="h-4 w-4" /></Link></CardContent></Card>)}
          </div>
          {data.areas.length === 0 ? <Card className="mt-4"><CardContent className="p-6 font-semibold text-brand-muted">No departmental operating area is assigned to this account.</CardContent></Card> : null}
        </section>

        <section className="mt-10" aria-labelledby="approval-heading">
          <div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-brand-red" /><div><h2 id="approval-heading" className="text-2xl font-black">Human approval queue</h2><p className="mt-1 text-sm font-semibold text-brand-muted">Approval records a decision only. SIA does not execute the proposed business mutation.</p></div></div>
          <div className="mt-4 space-y-4">
            {data.proposals.map((proposal) => <Card key={proposal.id}><CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase text-brand-red">{proposal.assistant.name}</span><span className="text-xs font-bold text-brand-muted">{proposal.createdAt.toLocaleString()}</span></div><h3 className="mt-2 text-lg font-black">{proposal.toolCode}</h3><p className="mt-2 leading-7 text-brand-muted">{proposal.reason}</p><pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-brand-card p-3 text-xs leading-5 text-brand-muted">{JSON.stringify(proposal.input, null, 2)}</pre><p className="mt-2 text-sm font-semibold text-brand-muted">Proposed by {proposal.actor.name}</p></div><ProposalReviewForm proposalId={proposal.id} /></CardContent></Card>)}
            {data.canApprove && data.proposals.length === 0 ? <Card><CardContent className="p-6 font-semibold text-brand-muted">No proposals are awaiting approval within your scope.</CardContent></Card> : null}
            {!data.canApprove ? <Card><CardContent className="p-6 font-semibold text-brand-muted">Your account can use SIA but cannot approve action proposals.</CardContent></Card> : null}
          </div>
        </section>

        <section className="mt-10 border-t border-black/10 pt-6"><p className="max-w-4xl text-sm font-semibold leading-6 text-brand-muted">SIA summarizes authorized source records and may draft or propose work. Permissions, organization scope, source-system validation, and accountable human approval remain authoritative.</p></section>
      </Container>
    </main>
  );
}
