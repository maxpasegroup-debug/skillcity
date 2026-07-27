import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function AchievementsPage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Achievements" title="Badges and milestones" description="Badges, milestones, streaks, hackathons, top performer awards, community awards and founder achievements." /><div className="grid gap-5 lg:grid-cols-2">{data.achievements.map((achievement) => <Card key={achievement.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{achievement.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{achievement.title}</h2><p className="mt-3 leading-7 text-brand-muted">{achievement.description}</p></CardContent></Card>)}</div></div>;
}
