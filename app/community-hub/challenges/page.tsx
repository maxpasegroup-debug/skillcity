import { Card, CardContent } from "@/components/ui/card";
import { ChallengeForm } from "@/features/community/components/community-forms";
import { JoinChallengeButton } from "@/features/community/components/community-action-buttons";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function ChallengesPage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Challenges" title="Challenge engine" description="7-day coding, 30-day AI, startup sprint, reading and contribution challenges." /><Card><CardContent className="p-6"><ChallengeForm groups={data.groups} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.challenges.map((challenge) => <Card key={challenge.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{challenge.rewardXp} XP - {challenge.rewardCoins} coins</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{challenge.title}</h2><p className="mt-3 leading-7 text-brand-muted">{challenge.description}</p><p className="mt-3 text-sm font-bold text-brand-muted">{challenge.participants.length} participants</p><div className="mt-5"><JoinChallengeButton challengeId={challenge.id} /></div></CardContent></Card>)}</div></div>;
}
