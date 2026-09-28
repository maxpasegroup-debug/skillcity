import { Card, CardContent } from "@/components/ui/card";
import { CareerTalentProfileForm } from "@/features/career-hub/components/career-hub-forms";
import { getMyCareerProfile } from "@/server/career-hub/queries";

export default async function CareerProfilePage() {
  const data = await getMyCareerProfile();
  return <div className="space-y-8"><header><p className="text-sm font-black uppercase text-brand-red">Career Hub</p><h1 className="mt-3 text-4xl font-black text-brand-dark">My Career Profile</h1><p className="mt-3 max-w-3xl font-semibold leading-7 text-brand-muted">A controlled career presentation linked to your central User identity. Visibility never makes internal AIRA records public.</p></header><Card><CardContent className="p-6 md:p-8"><CareerTalentProfileForm profile={data.profile} /></CardContent></Card><section className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="font-bold text-brand-muted">Verified Skills</p><p className="mt-2 text-3xl font-black">{data.portfolio?.skills.length ?? 0}</p></CardContent></Card><Card><CardContent className="p-5"><p className="font-bold text-brand-muted">Approved Projects</p><p className="mt-2 text-3xl font-black">{data.portfolio?.projects.length ?? 0}</p></CardContent></Card><Card><CardContent className="p-5"><p className="font-bold text-brand-muted">Resume Profiles</p><p className="mt-2 text-3xl font-black">{data.resumes.length}</p></CardContent></Card></section></div>;
}
