import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getSuccessData, requireSuccessStudent } from "@/server/success/queries";

export default async function CertificatesPage() {
  const user = await requireSuccessStudent();
  const data = await getSuccessData(user.id, user.name);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Certification Engine" title="Digital certificates" description="Course, skill, achievement, completion and instructor certificates include unique IDs and QR verification architecture." /><div className="grid gap-5 lg:grid-cols-2">{data.certificates.map((certificate) => <Card key={certificate.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{certificate.status} - {certificate.type}</p><h2 className="mt-2 text-2xl font-black text-brand-dark">{certificate.title}</h2><p className="mt-2 font-bold text-brand-muted">{certificate.certificateId}</p><p className="mt-2 text-sm font-bold text-brand-muted">{certificate.verifications[0]?.verificationCode ?? "Verification pending"}</p></CardContent></Card>)}{data.certificates.length === 0 ? <p className="font-semibold text-brand-muted">Certificates will appear after approval and issue.</p> : null}</div></div>;
}
