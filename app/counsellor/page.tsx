import Link from "next/link";
import { CalendarCheck, Clock, ClipboardCheck, PauseCircle, Search, ThumbsUp, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CounsellorCandidateCard } from "@/features/counsellor/components/counsellor-candidate-card";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCounsellorWorkspace, requireCounsellorUser } from "@/server/admissions/queries";

const filters = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "counselling-today", label: "Counselling Today" },
  { value: "follow-up", label: "Follow-up Today" },
  { value: "pending-decision", label: "Pending Decision" },
  { value: "application-pending", label: "Application Pending" },
  { value: "approved", label: "Approved" },
  { value: "on-hold", label: "On Hold" },
  { value: "not-interested", label: "Not Interested" }
];

export default async function CounsellorPage({ searchParams }: { searchParams?: Promise<{ q?: string; filter?: string; programId?: string; page?: string }> }) {
  const params = await searchParams;
  const user = await requireCounsellorUser();
  const query = params?.q ?? "";
  const activeFilter = params?.filter ?? "all";
  const programId = params?.programId ?? "";
  const page = Number(params?.page ?? "1");
  const data = await getCounsellorWorkspace({ user, query, filter: activeFilter, programId, page });
  const querySuffix = `${query ? `&q=${encodeURIComponent(query)}` : ""}${programId ? `&programId=${programId}` : ""}`;

  return (
    <div className="space-y-8">
      <DirectorPageHeader eyebrow="Counsellor OS" title={`Today's counselling, ${user.name}`} description="Open the right candidate, understand the context, record counselling, and move them to the next admission step." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="New Counselling" value={data.stats.newCounselling} icon={Users} />
        <DirectorMetricCard label="Counselling Today" value={data.stats.counsellingToday} icon={CalendarCheck} />
        <DirectorMetricCard label="Follow-ups Due" value={data.stats.followUpsDue} icon={Clock} />
        <DirectorMetricCard label="Pending Decisions" value={data.stats.pendingDecisions} icon={ClipboardCheck} />
        <DirectorMetricCard label="Qualified Candidates" value={data.stats.qualifiedCandidates} icon={UserCheck} />
        <DirectorMetricCard label="Application Pending" value={data.stats.applicationPending} icon={ClipboardCheck} />
        <DirectorMetricCard label="Approved" value={data.stats.approved} icon={ThumbsUp} />
        <DirectorMetricCard label="On Hold" value={data.stats.onHold} icon={PauseCircle} />
      </section>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <form className="grid gap-3 xl:grid-cols-[1fr_260px_auto]" action="/counsellor">
            <label className="relative block">
              <span className="sr-only">Search candidates</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input name="q" defaultValue={query} placeholder="Search by name, phone, WhatsApp or email" className="h-12 w-full rounded-lg border border-black/10 bg-white pl-11 pr-4 font-bold text-brand-dark outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/10" />
            </label>
            <label>
              <span className="sr-only">Program filter</span>
              <select name="programId" defaultValue={programId} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-bold text-brand-dark outline-none focus:border-brand-red focus:ring-4 focus:ring-brand-red/10">
                <option value="">All programs</option>
                {data.programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </label>
            <Button>Search</Button>
          </form>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <Link
                key={filter.value}
                href={`/counsellor?filter=${filter.value}${querySuffix}`}
                className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-black transition ${activeFilter === filter.value ? "border-brand-red bg-brand-red text-white" : "border-black/10 bg-white text-brand-muted hover:text-brand-red"}`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase text-brand-red">Counselling Queue</p>
            <h2 className="text-3xl font-black text-brand-dark">Who needs attention</h2>
          </div>
          <p className="text-sm font-bold text-brand-muted">{data.pagination.total} candidates</p>
        </div>

        {data.leads.map((candidate) => (
          <CounsellorCandidateCard key={candidate.id} candidate={candidate} />
        ))}

        {data.leads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-black text-brand-dark">No candidates in this view.</h3>
              <p className="mt-2 font-semibold text-brand-muted">Try another filter or search term.</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="secondary">
            <Link href={`/counsellor?filter=${activeFilter}${querySuffix}&page=${Math.max(1, data.pagination.page - 1)}`}>Previous</Link>
          </Button>
          <p className="text-sm font-black text-brand-muted">Page {data.pagination.page} of {data.pagination.pages}</p>
          <Button asChild variant="secondary">
            <Link href={`/counsellor?filter=${activeFilter}${querySuffix}&page=${Math.min(data.pagination.pages, data.pagination.page + 1)}`}>Next</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
