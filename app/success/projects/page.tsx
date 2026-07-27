import { Card, CardContent } from "@/components/ui/card";
import { ProjectForm } from "@/features/success/components/success-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function ProjectsPage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Project Showcase" title="Approved project proof" description="Each project can show screenshots, demo URL, GitHub URL, tech stack, mentor approval, featured status and tags." /><Card><CardContent className="p-6"><ProjectForm /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{data.projects.map((project) => <Card key={project.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{project.status}{project.featured ? " - Featured" : ""}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{project.title}</h2><p className="mt-3 leading-7 text-brand-muted">{project.description}</p><p className="mt-3 font-bold text-brand-muted">{project.techStack.join(", ") || "Tech stack pending"}</p>{project.githubUrl ? <a href={project.githubUrl} className="mt-2 block break-all font-bold text-brand-red">GitHub</a> : null}{project.demoUrl ? <a href={project.demoUrl} className="mt-2 block break-all font-bold text-brand-red">Demo</a> : null}</CardContent></Card>)}</div></div>;
}
