import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function CommunityWalletPage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Skill Coins Wallet" title="Wallet and rewards" description="Track Skill Coins, XP, levels, streaks, rewards, bonuses and redemptions." /><section className="grid gap-5 md:grid-cols-4"><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Skill Coins</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{data.wallet.skillCoins}</h2></CardContent></Card><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">XP</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{data.wallet.xp}</h2></CardContent></Card><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Level</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{data.wallet.level}</h2></CardContent></Card><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Streak</p><h2 className="mt-2 text-4xl font-black text-brand-dark">{data.wallet.streak}</h2></CardContent></Card></section><div className="grid gap-5 lg:grid-cols-2">{data.transactions.map((tx) => <Card key={tx.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{tx.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{tx.reason}</h2><p className="mt-2 font-bold text-brand-muted">{tx.xp} XP - {tx.coins} coins</p></CardContent></Card>)}</div></div>;
}
