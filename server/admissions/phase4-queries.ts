import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requireAdmissionUser } from "@/server/admissions/queries";
import { applicationScopeWhere, enrollmentScopeWhere, feeInvoiceScopeWhere, leadScopeWhere } from "@/server/auth/scoping";

export async function getAdmissionPhase4Queue() {
  const user = await requireAdmissionUser();
  const applicationScope = applicationScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const invoiceScope = feeInvoiceScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const enrollmentScope = enrollmentScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const leadScope = leadScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [applicationsAwaitingReview, approvedApplications, paymentPendingInvoices, paymentVerificationPending, rawActivationCandidates, batchPending, admissionConfirmedToday] = await Promise.all([
    prisma.admissionApplication.findMany({
      where: { AND: [applicationScope, { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }] },
      orderBy: { submittedAt: "asc" },
      take: 20,
      include: { lead: { include: { assignedTo: true, source: true, counsellingSessions: { orderBy: { updatedAt: "desc" }, take: 1 } } }, program: true, documents: true }
    }),
    prisma.admissionApplication.findMany({
      where: { AND: [applicationScope, { status: "APPROVED" }] },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: {
        lead: { include: { assignedTo: true, invoices: { orderBy: { updatedAt: "desc" }, include: { transactions: true } } } },
        program: true,
        student: true,
        studentLoginCredentials: { where: { status: "ACTIVE", revokedAt: null }, take: 1 }
      }
    }),
    prisma.feeInvoice.findMany({
      where: { AND: [invoiceScope, { status: { in: ["ISSUED", "PARTIALLY_PAID"] } }] },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { lead: { include: { applications: { orderBy: { updatedAt: "desc" }, take: 1 } } }, student: true, program: true, transactions: { orderBy: { createdAt: "desc" } } }
    }),
    prisma.paymentTransaction.findMany({
      where: { status: { in: ["INITIATED", "SUCCESS"] }, invoice: { AND: [invoiceScope, { status: { not: "PAID" } }] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { invoice: { include: { lead: true, program: true } } }
    }),
    prisma.admissionApplication.findMany({
      where: { AND: [applicationScope, { status: "APPROVED", studentId: null, OR: [{ program: { feeType: "FREE" } }, { lead: { invoices: { some: { status: "PAID" } } } }] }] },
      orderBy: { reviewedAt: "desc" },
      take: 100,
      include: {
        lead: { include: { invoices: { where: { status: "PAID" }, orderBy: { updatedAt: "desc" } } } },
        program: true
      }
    }),
    prisma.studentEnrollment.findMany({
      where: { AND: [enrollmentScope, { status: "ACTIVE", batchId: null }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { student: true, program: true }
    }),
    prisma.lead.count({ where: { AND: [leadScope, { status: "WON", convertedAt: { gte: today } }] } })
  ]);

  const activationCandidates = rawActivationCandidates
    .filter((application) => application.program.feeType === "FREE" || application.lead.invoices.some((invoice) => invoice.programId === application.programId))
    .slice(0, 20);

  return {
    applicationsAwaitingReview,
    approvedApplications,
    paymentPendingInvoices,
    paymentVerificationPending,
    activationCandidates,
    batchPending,
    stats: {
      applications: applicationsAwaitingReview.length + approvedApplications.length,
      pendingReview: applicationsAwaitingReview.length,
      paymentPending: paymentPendingInvoices.length,
      paymentVerification: paymentVerificationPending.length,
      admissionConfirmed: admissionConfirmedToday,
      studentActivationPending: activationCandidates.length,
      batchAssignmentPending: batchPending.length
    }
  };
}

export async function getAdmissionPhase4Application(applicationId: string) {
  const user = await requireAdmissionUser();
  const scope = applicationScopeWhere(user, PERMISSIONS.ADMISSIONS_ACCESS);
  return prisma.admissionApplication.findFirst({
    where: { AND: [{ id: applicationId }, scope] },
    include: {
      lead: {
        include: {
          assignedTo: true,
          source: true,
          activities: { orderBy: { createdAt: "desc" }, take: 60, include: { actor: true } },
          leadNotes: { orderBy: { createdAt: "desc" }, take: 30, include: { author: true } },
          counsellingSessions: { orderBy: { updatedAt: "desc" }, include: { counsellor: true, batch: true } },
          invoices: { orderBy: { updatedAt: "desc" }, include: { transactions: { orderBy: { createdAt: "desc" } }, program: true, batch: true } }
        }
      },
      program: { include: { journeys: { where: { status: "ACTIVE" }, orderBy: { version: "desc" }, take: 1 }, batches: { where: { status: "ACTIVE" }, orderBy: { startsAt: "asc" } } } },
      student: { include: { enrollments: { include: { program: true, batch: true, journey: true } }, activationProfile: true } },
      documents: true,
      studentLoginCredentials: { orderBy: { createdAt: "desc" }, take: 3 },
      whatsAppMessageLogs: { orderBy: { createdAt: "desc" }, take: 3 }
    }
  });
}
