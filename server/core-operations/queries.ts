import { prisma } from "@/lib/prisma";
import { PERMISSIONS, type PermissionKey } from "@/lib/auth/permissions";
import { effectiveComplianceStatus } from "@/lib/core-operations/policies";
import { requirePermission } from "@/server/auth/authorization";
import { campusScopeWhere, complianceRecordScopeWhere, coreDocumentScopeWhere, departmentScopeWhere, districtScopeWhere, divisionScopeWhere, employeeScopeWhere, feeInvoiceScopeWhere, institutionScopeWhere, paymentTransactionScopeWhere, programScopeWhere } from "@/server/auth/scoping";

export const coreDocumentVersionPresentationSelect = {
  id: true,
  version: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  storageProvider: true,
  checksum: true,
  createdAt: true,
  uploadedBy: { select: { name: true } }
} as const;

export async function getDocumentDirectory() {
  const actor = await requirePermission(PERMISSIONS.DOCUMENTS_READ);
  return prisma.coreDocument.findMany({
    where: coreDocumentScopeWhere(actor, PERMISSIONS.DOCUMENTS_READ),
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { institution: true, division: true, campus: true, owner: { select: { id: true, name: true } }, versions: { orderBy: { version: "desc" }, take: 1, select: { version: true, originalFilename: true, mimeType: true, sizeBytes: true, storageProvider: true, createdAt: true } } }
  });
}

export async function getCoreDocumentDetail(id: string) {
  const actor = await requirePermission(PERMISSIONS.DOCUMENTS_READ);
  return prisma.coreDocument.findFirst({
    where: { AND: [{ id }, coreDocumentScopeWhere(actor, PERMISSIONS.DOCUMENTS_READ)] },
    include: { institution: true, division: true, district: true, campus: true, department: true, owner: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } }, versions: { orderBy: { version: "desc" }, select: { id: true, version: true, originalFilename: true, mimeType: true, sizeBytes: true, storageProvider: true, checksum: true, createdAt: true, uploadedBy: { select: { name: true } } } }, contextLinks: true, complianceRecords: { include: { complianceRecord: { select: { id: true, code: true, title: true, status: true } } } } }
  });
}

export async function getComplianceDirectory() {
  const actor = await requirePermission(PERMISSIONS.COMPLIANCE_READ);
  const records = await prisma.complianceRecord.findMany({
    where: complianceRecordScopeWhere(actor, PERMISSIONS.COMPLIANCE_READ), orderBy: [{ reviewAt: "asc" }, { expiresAt: "asc" }, { updatedAt: "desc" }], take: 100,
    include: { institution: true, division: true, campus: true, responsibleEmployee: { include: { user: { select: { name: true } } } }, reviewerEmployee: { include: { user: { select: { name: true } } } }, documents: { include: { document: { select: { id: true, code: true, displayName: true, status: true } } } } }
  });
  return records.map((record) => ({ ...record, effectiveStatus: effectiveComplianceStatus(record.status, record.expiresAt) }));
}

export async function getFinanceOverview() {
  const actor = await requirePermission(PERMISSIONS.FINANCE_READ);
  const invoiceWhere = feeInvoiceScopeWhere(actor, PERMISSIONS.FINANCE_READ);
  const paymentWhere = paymentTransactionScopeWhere(actor, PERMISSIONS.FINANCE_READ);
  const [invoices, payments, totalsByCurrency] = await Promise.all([
    prisma.feeInvoice.findMany({ where: invoiceWhere, orderBy: { updatedAt: "desc" }, take: 100, include: { institution: true, program: true, student: { select: { id: true, name: true } }, transactions: { select: { amount: true, status: true } } } }),
    prisma.paymentTransaction.findMany({ where: paymentWhere, orderBy: { createdAt: "desc" }, take: 100, include: { invoice: { select: { id: true, invoiceNo: true, currency: true, total: true } }, recordedBy: { select: { name: true } }, verifiedBy: { select: { name: true } } } }),
    prisma.feeInvoice.groupBy({ by: ["currency"], where: invoiceWhere, _sum: { total: true }, _count: true })
  ]);
  return { invoices, payments, totalsByCurrency };
}

export async function getFinanceInvoiceDetail(id: string) {
  const actor = await requirePermission(PERMISSIONS.FINANCE_READ);
  return prisma.feeInvoice.findFirst({
    where: { AND: [{ id }, feeInvoiceScopeWhere(actor, PERMISSIONS.FINANCE_READ)] },
    include: { institution: true, division: true, district: true, campus: true, department: true, program: true, student: { select: { id: true, name: true } }, lead: { select: { id: true, name: true } }, createdBy: { select: { name: true } }, transactions: { orderBy: { createdAt: "desc" }, include: { recordedBy: { select: { name: true } }, verifiedBy: { select: { name: true } } } } }
  });
}

export async function getCoreOperationOptions(permission: PermissionKey) {
  const actor = await requirePermission(permission);
  const [institutions, divisions, districts, campuses, departments, employees, programs] = await Promise.all([
    prisma.institution.findMany({ where: institutionScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.division.findMany({ where: divisionScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true } }),
    prisma.district.findMany({ where: districtScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true } }),
    prisma.campus.findMany({ where: campusScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true, districtId: true } }),
    prisma.department.findMany({ where: departmentScopeWhere(actor, permission), orderBy: { name: "asc" }, select: { id: true, name: true, institutionId: true, divisionId: true, campusId: true } }),
    prisma.employee.findMany({ where: { AND: [employeeScopeWhere(actor, permission), { status: { in: ["ACTIVE", "PROBATION", "ON_NOTICE"] } }] }, orderBy: { user: { name: "asc" } }, take: 200, select: { id: true, institutionId: true, divisionId: true, districtId: true, campusId: true, departmentId: true, user: { select: { name: true } } } }),
    prisma.program.findMany({ where: programScopeWhere(actor, permission), orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } })
  ]);
  return { institutions, divisions, districts, campuses, departments, employees, programs };
}
