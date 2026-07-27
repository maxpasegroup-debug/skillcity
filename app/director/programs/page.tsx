import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorEmptyState } from "@/features/director/components/director-empty-state";
import { ProgramForm } from "@/features/director/components/director-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getDirectorPrograms } from "@/server/director/queries";

export default async function DirectorProgramsPage() {
  const programs = await getDirectorPrograms();

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Programs" title="Program management" description="Create and maintain the programs that power SkillCity journeys." />
      <Card><CardContent className="p-6 md:p-8"><ProgramForm /></CardContent></Card>
      <section className="space-y-4">
        <h2 className="text-2xl font-black text-brand-dark">Programs</h2>
        {programs.length === 0 ? <DirectorEmptyState icon={BookOpen} message="No programs are configured yet. Create the first program above to begin planning its journey." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            {programs.map((program) => (
              <Card key={program.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-brand-red">{program.status}</p>
                      <h3 className="mt-2 text-2xl font-black text-brand-dark">{program.name}</h3>
                      <p className="mt-3 text-base leading-7 text-brand-muted">{program.description}</p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-brand-muted">{program.durationDays} days</p>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm font-bold text-brand-muted sm:grid-cols-3">
                    <p>Journey v{program.journeys[0]?.version ?? 0}</p>
                    <p>{program.batches.length} batches</p>
                    <p>{program.enrollments.length} students</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
