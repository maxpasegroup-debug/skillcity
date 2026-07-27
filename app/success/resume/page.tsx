import { Card, CardContent } from "@/components/ui/card";
import { ResumeForm } from "@/features/success/components/success-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function ResumePage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Resume Builder" title="Export-ready resume profiles" description="Professional, founder and developer resumes with AI-assisted summaries. PDF generation can be added later." /><Card><CardContent className="p-6"><ResumeForm /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.resumes.map((resume) => <Card key={resume.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{resume.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{resume.headline ?? "Resume headline pending"}</h2><p className="mt-3 leading-7 text-brand-muted">{resume.summary ?? "Summary pending"}</p></CardContent></Card>)}</div></div>;
}
