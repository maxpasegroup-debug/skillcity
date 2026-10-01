import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CircleHelp, ClipboardCheck, FlaskConical, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { resolveDefaultV2Workspace } from "@/lib/auth/v2-governance";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Dashboard | AIRA Labs" };

export default async function LabsMemberDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/aira-labs/sign-in");
  if (!hasPermission(user, PERMISSIONS.LABS_PORTAL_ACCESS)) redirect(resolveDefaultV2Workspace(user)?.href ?? "/");

  const [applications, enquiries] = await Promise.all([
    prisma.admissionApplication.findMany({
      where: { OR: [{ studentId: user.id }, { lead: { email: { equals: user.email, mode: "insensitive" } } }], program: { slug: "aira-labs" } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, submittedAt: true, updatedAt: true, program: { select: { name: true } } }
    }),
    prisma.lead.findMany({
      where: { email: { equals: user.email, mode: "insensitive" }, programInterested: { slug: "aira-labs" } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, status: true, updatedAt: true, pipelineStage: { select: { name: true } }, applications: { where: { program: { slug: "aira-labs" } }, select: { id: true }, take: 1 } }
    })
  ]);
  const enquiryOnly = enquiries.filter((lead) => lead.applications.length === 0);

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-[#111814]">
      <header className="border-b border-black/10 bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/aira-labs" className="flex items-center gap-3 font-black"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#e52b2f] text-white"><FlaskConical className="h-5 w-5" /></span>AIRA LABS</Link><form action={logoutAction}><Button variant="ghost" className="h-10 px-3 text-sm"><LogOut className="h-4 w-4" />Sign out</Button></form></div></header>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <p className="text-sm font-black uppercase text-[#b51f27]">Personal dashboard</p><h1 className="mt-2 text-4xl font-black">Welcome, {user.name}</h1><p className="mt-3 max-w-2xl font-semibold leading-7 text-[#58645e]">Apply, make an enquiry and follow every AIRA Labs update from this account.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><Link href="/aira-labs/dashboard/apply">Start an application <ArrowRight className="h-5 w-5" /></Link></Button><Button asChild size="lg" variant="secondary"><Link href="/aira-labs/dashboard/apply">Make an enquiry</Link></Button></div>

        <section className="mt-14 grid gap-8 lg:grid-cols-2">
          <div><div className="flex items-center gap-3"><ClipboardCheck className="h-6 w-6 text-[#e52b2f]" /><h2 className="text-2xl font-black">Applications</h2></div><div className="mt-5 space-y-3">{applications.length ? applications.map((application) => <article key={application.id} className="rounded-lg border border-black/10 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{application.program.name}</p><p className="mt-1 text-sm font-semibold text-[#58645e]">Submitted {formatDate(application.submittedAt ?? application.updatedAt)}</p></div><StatusBadge label={application.status} /></div></article>) : <EmptyState message="No application yet. Start when you are ready." />}</div></div>
          <div><div className="flex items-center gap-3"><CircleHelp className="h-6 w-6 text-[#198b83]" /><h2 className="text-2xl font-black">Enquiries</h2></div><div className="mt-5 space-y-3">{enquiryOnly.length ? enquiryOnly.map((lead) => <article key={lead.id} className="rounded-lg border border-black/10 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">AIRA Labs enquiry</p><p className="mt-1 text-sm font-semibold text-[#58645e]">Updated {formatDate(lead.updatedAt)}</p></div><StatusBadge label={lead.pipelineStage.name || lead.status} /></div></article>) : <EmptyState message="No open enquiry is linked to this account." />}</div></div>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: Date) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(value); }
function StatusBadge({ label }: { label: string }) { return <span className="rounded-full bg-[#dff7f3] px-3 py-1 text-xs font-black uppercase text-[#126a64]">{label.replaceAll("_", " ")}</span>; }
function EmptyState({ message }: { message: string }) { return <div className="rounded-lg border border-dashed border-black/20 bg-white/60 p-6 font-semibold text-[#58645e]">{message}</div>; }
