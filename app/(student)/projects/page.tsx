import Link from "next/link";
import { Presentation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { StudentEmptyPage } from "@/features/journey/components/student-empty-page";
import { getStudentAcademicProjects, requireStudent } from "@/server/journey/queries";

export default async function ProjectsPage() {
  const student = await requireStudent();
  const data = await getStudentAcademicProjects(student.id);
  if (!data.enrollment || data.projects.length === 0) {
    return <StudentEmptyPage eyebrow="Projects" title="Your project work" message="Projects connected to your current journey will appear here when your program team assigns them." icon={Presentation} />;
  }

  return (
    <div className="space-y-8">
      <DirectorPageHeader eyebrow="Build" title="Academic projects" description="Project work from your active program and batch journey." />
      <section className="grid gap-5 lg:grid-cols-2">
        {data.projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-6">
              <p className="text-sm font-black uppercase text-brand-red">{project.alttStage} - Day {project.dayNumber}</p>
              <h2 className="mt-2 text-2xl font-black text-brand-dark">{project.title}</h2>
              <p className="mt-3 leading-7 text-brand-muted">{project.description ?? "Project instructions are available in your journey."}</p>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm font-bold text-brand-muted">
                <span>{project.progressStatus.replaceAll("_", " ")}</span>
                <span>{project.submissionStatus?.replaceAll("_", " ") ?? "Not submitted"}</span>
              </div>
              <Link href={`/my-journey/day/${project.dayId}`} className="mt-5 inline-block font-black text-brand-red">Open project</Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
