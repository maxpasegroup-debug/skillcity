import { Card, CardContent } from "@/components/ui/card";
import { EventForm } from "@/features/community/components/community-forms";
import { RegisterEventButton } from "@/features/community/components/community-action-buttons";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function EventsPage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Events" title="Workshops and live community events" description="Workshops, live sessions, hackathons, meetups, bootcamps, career fairs and guest lectures." /><Card><CardContent className="p-6"><EventForm groups={data.groups} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.events.map((event) => <Card key={event.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{event.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{event.title}</h2><p className="mt-2 font-bold text-brand-muted">{event.startsAt.toLocaleString()} - {event.registrations.length}/{event.capacity ?? "Open"}</p><p className="mt-3 leading-7 text-brand-muted">{event.description ?? "Community event"}</p><div className="mt-5"><RegisterEventButton eventId={event.id} /></div></CardContent></Card>)}</div></div>;
}
