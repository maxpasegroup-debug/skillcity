import { Card, CardContent } from "@/components/ui/card";
import { PortfolioForm } from "@/features/success/components/success-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function PortfolioPage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Digital Portfolio" title="Your public proof" description="Bio, skills, programs, projects, links, achievements, certificates and visibility controls." /><Card><CardContent className="p-6"><PortfolioForm portfolio={data.portfolio} /></CardContent></Card><Card><CardContent className="p-6"><p className="font-bold text-brand-muted">Public Profile URL</p><p className="mt-2 break-all text-2xl font-black text-brand-dark">/portfolio/{data.portfolio.publicSlug}</p></CardContent></Card></div>;
}
