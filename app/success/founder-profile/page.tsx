import { Card, CardContent } from "@/components/ui/card";
import { FounderProfileForm } from "@/features/success/components/success-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function FounderProfilePage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Founder Profile" title="Solo founder proof" description="Track business name, industry, revenue stage, products, website, pitch deck, traction, customers and mentor feedback." /><Card><CardContent className="p-6"><FounderProfileForm founder={data.founder} /></CardContent></Card></div>;
}
