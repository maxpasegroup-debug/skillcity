import { Card, CardContent } from "@/components/ui/card";
import { DocumentForm } from "@/features/admissions/components/admission-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionsOperationalLists } from "@/server/admissions/queries";
import { prisma } from "@/lib/prisma";

export default async function DocumentsPage() {
  const [[applications, documents], students] = await Promise.all([getAdmissionsOperationalLists(), prisma.user.findMany({ where: { roles: { some: { role: { name: "Student" } } } }, orderBy: { name: "asc" } })]);
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Documents" title="Document management" /><Card><CardContent className="p-6"><DocumentForm applications={applications.map((a) => ({ id: a.id, name: a.lead.name }))} students={students} /></CardContent></Card><div className="grid gap-5 lg:grid-cols-2">{documents.map((doc) => <Card key={doc.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{doc.status}</p><h3 className="mt-2 text-2xl font-black text-brand-dark">{doc.title}</h3><p className="mt-2 font-bold text-brand-muted">{doc.type} · {doc.application?.lead.name ?? doc.student?.name ?? "Unlinked"}</p></CardContent></Card>)}</div></div>;
}
