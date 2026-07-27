import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function SkillsPage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Skill Passport" title="Verified skills" description="Skills are verified through projects, submissions, assessments, certificates, URLs and trainer feedback." /><div className="grid gap-5 lg:grid-cols-2">{data.skills.map((skill) => <Card key={skill.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{skill.level}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{skill.name}</h2><p className="mt-2 font-bold text-brand-muted">{skill.verificationSource} - {skill.earnedAt.toDateString()}</p><p className="mt-2 text-sm font-bold text-brand-muted">{skill.evidence.length} evidence records</p></CardContent></Card>)}{data.skills.length === 0 ? <p className="font-semibold text-brand-muted">Verified skills will appear after trainer or director verification.</p> : null}</div></div>;
}
