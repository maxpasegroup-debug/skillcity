import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function CommunityAnnouncementsPage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Announcements" title="Community announcements" description="Trainer and community announcements for daily participation." /><div className="grid gap-5 lg:grid-cols-2">{data.announcements.map((item) => <Card key={item.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{item.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{item.title}</h2><p className="mt-3 leading-7 text-brand-muted">{item.message}</p></CardContent></Card>)}</div></div>;
}
