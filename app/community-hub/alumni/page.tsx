import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getCommunityData, requireCommunityUser } from "@/server/community/queries";

export default async function AlumniPage() {
  const user = await requireCommunityUser();
  const data = await getCommunityData(user.id);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Alumni" title="Alumni network" description="Graduates remain connected through employment, business, mentorship, speaking and community contribution." /><div className="grid gap-5 lg:grid-cols-2">{data.alumni.map((alum) => <Card key={alum.id}><CardContent className="p-6"><h2 className="text-2xl font-black text-brand-dark">{alum.user.name}</h2><p className="mt-2 font-bold text-brand-muted">{alum.employment ?? alum.business ?? "Alumni member"}</p><p className="mt-3 leading-7 text-brand-muted">{alum.networkingBio ?? "Open to SkillCity community networking."}</p></CardContent></Card>)}</div></div>;
}
