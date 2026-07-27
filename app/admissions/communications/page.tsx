import { Card, CardContent } from "@/components/ui/card";
import { CommunicationForm } from "@/features/admissions/components/admission-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionData, getAdmissionsOperationalLists } from "@/server/admissions/queries";

export default async function CommunicationsPage() {
  const [{ leads }, [, , , , logs]] = await Promise.all([getAdmissionData(), getAdmissionsOperationalLists()]);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Communications" title="Admission communications" description="Email, SMS, WhatsApp, internal notifications, scheduled campaigns, and templates architecture." /><Card><CardContent className="p-6"><CommunicationForm leads={leads} /></CardContent></Card><div className="space-y-4">{logs.map((log) => <Card key={log.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{log.channel} · {log.status}</p><h3 className="mt-2 text-2xl font-black text-brand-dark">{log.subject ?? "Untitled communication"}</h3><p className="mt-2 text-brand-muted">{log.message}</p></CardContent></Card>)}</div></div>;
}
