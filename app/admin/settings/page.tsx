import Link from "next/link";
import { Building2, ListChecks, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { ensureDefaultPipeline } from "@/server/admissions/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const stages = await ensureDefaultPipeline();

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admin" title="Launch settings" description="Keep launch controls simple: programs, pipeline stages, and role-gated access remain managed through existing services." />
      <section className="grid gap-5 md:grid-cols-3">
        <Link href="/admissions/programs">
          <Card className="h-full transition hover:-translate-y-1 hover:shadow-soft">
            <CardContent className="p-6">
              <Building2 className="h-8 w-8 text-brand-red" />
              <h2 className="mt-5 text-2xl font-black text-brand-dark">Programs</h2>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">Add new programs, open admission, close admission or move programs to waiting list.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admissions/settings">
          <Card className="h-full transition hover:-translate-y-1 hover:shadow-soft">
            <CardContent className="p-6">
              <ListChecks className="h-8 w-8 text-brand-red" />
              <h2 className="mt-5 text-2xl font-black text-brand-dark">Pipeline</h2>
              <p className="mt-3 font-semibold leading-7 text-brand-muted">Review the standard acquisition path from new lead to active student.</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-6">
            <ShieldCheck className="h-8 w-8 text-brand-red" />
            <h2 className="mt-5 text-2xl font-black text-brand-dark">Access Rule</h2>
            <p className="mt-3 font-semibold leading-7 text-brand-muted">Students enter only after application approval, WhatsApp PIN generation, and first-login PIN reset.</p>
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-black text-brand-dark">Pipeline Stages</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stages.map((stage) => (
              <div key={stage.id} className="rounded-lg bg-white p-4">
                <p className="text-sm font-black text-brand-red">Stage {stage.order}</p>
                <p className="mt-1 font-black text-brand-dark">{stage.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
