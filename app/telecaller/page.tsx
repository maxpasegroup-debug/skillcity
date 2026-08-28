import Link from "next/link";
import { CalendarClock, CheckCircle2, MessageCircle, PhoneCall, Search, Send, Target, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { LeadCard } from "@/features/telecaller/components/lead-card";
import { getTelecallerWorkspace, requireTelecallerUser } from "@/server/admissions/queries";

const filters = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "follow-up", label: "Follow-up Today" },
  { value: "interested", label: "Interested" },
  { value: "callback", label: "Callback" },
  { value: "qualified", label: "Qualified" },
  { value: "sent-to-counsellor", label: "Sent to Counsellor" },
  { value: "not-interested", label: "Not Interested" }
];

export default async function TelecallerPage({ searchParams }: { searchParams?: Promise<{ q?: string; filter?: string }> }) {
  const params = await searchParams;
  const user = await requireTelecallerUser();
  const query = params?.q ?? "";
  const activeFilter = params?.filter ?? "all";
  const data = await getTelecallerWorkspace({ user, query, filter: activeFilter });

  return (
    <div className="space-y-8">
      <DirectorPageHeader eyebrow="Telecaller OS" title={`Today's work, ${user.name}`} description="Contact leads, record simple outcomes, schedule follow-ups, and send qualified candidates to counselling." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="New Leads" value={data.stats.newLeads} icon={Users} />
        <DirectorMetricCard label="Follow-ups Due" value={data.stats.followUps} icon={CalendarClock} />
        <DirectorMetricCard label="Applications" value={data.stats.applications} icon={CheckCircle2} />
        <DirectorMetricCard label="Enquiries" value={data.stats.enquiries} icon={MessageCircle} />
        <DirectorMetricCard label="Counselling Pending" value={data.stats.counsellingPending} icon={UserCheck} />
        <DirectorMetricCard label="Completed Today" value={data.stats.completedToday} icon={Target} />
        <DirectorMetricCard label="Calls Made" value={data.stats.callsMade} icon={PhoneCall} />
        <DirectorMetricCard label="Sent to Counsellor" value={data.stats.sentToCounsellor} icon={Send} />
      </section>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <form className="grid gap-3 lg:grid-cols-[1fr_auto]" action="/telecaller">
            <label className="relative block">
              <span className="sr-only">Search leads</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input name="q" defaultValue={query} placeholder="Search by name, phone, WhatsApp or email" className="h-12 w-full rounded-lg border border-black/10 bg-white pl-11 pr-4 font-bold text-brand-dark outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/10" />
            </label>
            <Button>Search</Button>
          </form>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <Link
                key={filter.value}
                href={`/telecaller?filter=${filter.value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-black transition ${activeFilter === filter.value ? "border-brand-red bg-brand-red text-white" : "border-black/10 bg-white text-brand-muted hover:text-brand-red"}`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-brand-red">Main Lead Queue</p>
            <h2 className="text-3xl font-black text-brand-dark">Leads to contact</h2>
          </div>
          <p className="text-sm font-bold text-brand-muted">{data.leads.length} shown</p>
        </div>

        {data.leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}

        {data.leads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-black text-brand-dark">No leads in this view.</h3>
              <p className="mt-2 font-semibold text-brand-muted">Try another filter or search term.</p>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
