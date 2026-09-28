import { Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getMyCareerReferrals } from "@/server/career-hub/queries";

export default async function MyCareerReferralsPage() {
  const referrals = await getMyCareerReferrals();
  return <div className="space-y-8"><header><p className="text-sm font-black uppercase text-brand-red">Nice Jobs</p><h1 className="mt-3 text-4xl font-black text-brand-dark">My Referrals</h1><p className="mt-3 max-w-3xl font-semibold text-brand-muted">Attribution records only. Referral creation does not create money, coins, commission, or payout.</p></header>{referrals.length === 0 ? <Card><CardContent className="flex min-h-40 items-center gap-4 p-6"><Share2 className="h-8 w-8 text-brand-red" /><p className="font-bold text-brand-muted">No referral attribution has been created.</p></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{referrals.map((referral) => <Card key={referral.id}><CardContent className="p-6"><p className="text-xs font-black uppercase text-brand-red">{referral.status}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{referral.opportunity.title}</h2><p className="mt-1 font-bold text-brand-muted">{referral.opportunity.employer.name}</p><p className="mt-4 rounded-lg bg-brand-beige p-3 font-mono font-black text-brand-dark">{referral.code}</p><p className="mt-3 text-sm font-bold text-brand-muted">Attributed applications: {referral._count.applications}</p></CardContent></Card>)}</div>}</div>;
}
