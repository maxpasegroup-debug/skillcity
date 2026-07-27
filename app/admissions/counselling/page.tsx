import { Card, CardContent } from "@/components/ui/card";
import { CounsellingForm } from "@/features/admissions/components/admission-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionData, getAdmissionsOperationalLists } from "@/server/admissions/queries";

export default async function CounsellingPage() {
  const [{ leads, batches }, [, , , sessions]] = await Promise.all([getAdmissionData(), getAdmissionsOperationalLists()]);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Counselling" title="Counselling sessions" /><Card><CardContent className="p-6"><CounsellingForm leads={leads} batches={batches} /></CardContent></Card><div className="space-y-4">{sessions.map((s) => <Card key={s.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{s.outcome}</p><h3 className="mt-2 text-2xl font-black text-brand-dark">{s.lead.name}</h3><p className="mt-2 font-bold text-brand-muted">{s.scheduledAt.toLocaleString()} · {s.counsellor?.name ?? "Unassigned"}</p></CardContent></Card>)}</div></div>;
}
