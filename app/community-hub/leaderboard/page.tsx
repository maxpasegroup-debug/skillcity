import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { prisma } from "@/lib/prisma";

export default async function LeaderboardPage() {
  const wallets = await prisma.wallet.findMany({ orderBy: [{ xp: "desc" }, { skillCoins: "desc" }], take: 25, include: { user: true } });
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Leaderboard" title="XP and Skill Coins" description="Recognition for consistency, contribution, collaboration and progress." /><div className="space-y-4">{wallets.map((wallet, index) => <Card key={wallet.id}><CardContent className="flex items-center justify-between p-6"><div><p className="text-sm font-black text-brand-red">Rank {index + 1}</p><h2 className="mt-1 text-2xl font-black text-brand-dark">{wallet.user.name}</h2></div><p className="text-xl font-black text-brand-dark">{wallet.xp} XP - {wallet.skillCoins} coins</p></CardContent></Card>)}</div></div>;
}
