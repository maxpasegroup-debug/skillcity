import { Card, CardContent } from "@/components/ui/card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { prisma } from "@/lib/prisma";

export default async function EnrollmentsPage() {
  const logs = await prisma.enrollmentLog.findMany({ orderBy: { createdAt: "desc" }, include: { student: true, batch: true, enrollment: { include: { program: true } } } });
  return <div className="space-y-10"><DirectorPageHeader eyebrow="Enrollments" title="Payment to batch allocation" /><div className="space-y-4">{logs.length === 0 ? <Card><CardContent className="p-6 text-brand-muted font-bold">Enrollment logs will appear when paid leads are converted.</CardContent></Card> : logs.map((log) => <Card key={log.id}><CardContent className="p-6"><p className="text-sm font-black text-brand-red">{log.action}</p><h3 className="mt-2 text-2xl font-black text-brand-dark">{log.student.name}</h3><p className="mt-2 font-bold text-brand-muted">{log.enrollment?.program.name ?? "Program"} · {log.batch?.name ?? "Batch"}</p></CardContent></Card>)}</div></div>;
}
