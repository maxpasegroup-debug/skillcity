import { Link2, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getBdmDashboard, requireBdmUser } from "@/server/admissions/queries";

export default async function BdmReferralsPage() {
  const user = await requireBdmUser();
  const { referrals } = await getBdmDashboard(user.id);
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/apply?ref=${user.id}`;

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Referral Link" title="Share Skill City" description="Use one trackable link for referral campaigns and partner conversations." />
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-brand-red"><Link2 className="h-5 w-5" /><p className="font-black">Your referral link</p></div>
            <p className="mt-4 break-all rounded-lg bg-white p-4 font-bold text-brand-dark">{referralLink}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid min-h-64 place-items-center p-6 text-center">
            <QrCode className="h-28 w-28 text-brand-red" />
            <p className="mt-4 font-bold text-brand-muted">QR architecture is ready for generated campaign codes.</p>
          </CardContent>
        </Card>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        {referrals.map((referral) => (
          <Card key={referral.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{referral.convertedAt ? "Converted" : "Open"}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{referral.code}</h2><p className="mt-2 font-bold text-brand-muted">{referral.program?.name ?? "All programs"} - {referral.lead?.name ?? "No lead yet"}</p></CardContent></Card>
        ))}
      </div>
    </div>
  );
}
