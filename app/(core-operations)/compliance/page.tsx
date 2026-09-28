import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ComplianceRecordForm, ComplianceStatusForm } from "@/features/core-operations/components/core-operation-forms";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { getComplianceDirectory, getCoreOperationOptions } from "@/server/core-operations/queries";

export default async function CompliancePage() {
  const actor = await requirePermission(PERMISSIONS.COMPLIANCE_READ);
  const manage = hasPermission(actor, PERMISSIONS.COMPLIANCE_MANAGE);
  const [records, options] = await Promise.all([getComplianceDirectory(), manage ? getCoreOperationOptions(PERMISSIONS.COMPLIANCE_MANAGE) : null]);
  return <div className="space-y-8"><PageHeader title="Compliance Register" subtitle="Scoped operational records, ownership, review dates, expiry, and supporting documents." />{options ? <Card><CardContent className="p-6"><h2 className="mb-5 text-2xl font-black">Create compliance record</h2><ComplianceRecordForm options={options} /></CardContent></Card> : null}<div className="space-y-4">{records.map((record) => <Card key={record.id}><CardContent className="p-6"><div className="flex flex-col justify-between gap-5 lg:flex-row"><div><p className="text-xs font-black uppercase text-brand-red">{record.effectiveStatus} · {record.subjectType}</p><h2 className="mt-2 text-2xl font-black">{record.title}</h2><p className="mt-2 font-bold text-brand-muted">{record.code} · {record.institution.name}</p><p className="mt-2 text-sm font-semibold text-brand-muted">Responsible: {record.responsibleEmployee?.user.name ?? "Unassigned"} · Reviewer: {record.reviewerEmployee?.user.name ?? "Unassigned"}</p><p className="mt-1 text-sm font-semibold text-brand-muted">Review: {record.reviewAt?.toLocaleDateString() ?? "Not scheduled"} · Expiry: {record.expiresAt?.toLocaleDateString() ?? "No expiry"}</p></div>{manage ? <ComplianceStatusForm id={record.id} status={record.status} /> : null}</div></CardContent></Card>)}{records.length === 0 ? <Card><CardContent className="p-6 font-bold text-brand-muted">No authorized compliance records.</CardContent></Card> : null}</div></div>;
}
