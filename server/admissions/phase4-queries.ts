import { prisma } from "@/lib/prisma";

export async function getAdmissionPhase4Queue() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [applicationsAwaitingReview, approvedApplications, paymentPendingInvoices, paymentVerificationPending, activationCandidates, batchPending, admissionConfirmedToday] = await Promise.all([
    prisma.admissionApplication.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      orderBy: { submittedAt: "asc" },
      take: 20,
      include: { lead: { include: { assignedTo: true, source: true, counsellingSessions: { orderBy: { updatedAt: "desc" }, take: 1 } } }, program: true, documents: true }
    }),
    prisma.admissionApplication.findMany({
      where: { status: "APPROVED" },
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
      where: { status: { in: ["ISSUED", "PARTIALLY_PAID"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { lead: { include: { applications: { orderBy: { updatedAt: "desc" }, take: 1 } } }, student: true, program: true, transactions: { orderBy: { createdAt: "desc" } } }
    }),
    prisma.paymentTransaction.findMany({
      where: { status: { in: ["INITIATED", "SUCCESS"] }, invoice: { status: { not: "PAID" } } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { invoice: { include: { lead: true, program: true } } }
    }),
    prisma.admissionApplication.findMany({
      where: {
        status: "APPROVED",
        studentId: null,
        OR: [
          { program: { feeType: "FREE" } },
          { lead: { invoices: { some: { status: "PAID" } } } }
        ]
      },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: { lead: { include: { invoices: { where: { status: "PAID" }, orderBy: { updatedAt: "desc" }, take: 1 } } }, program: true }
    }),
    prisma.studentEnrollment.findMany({
      where: { status: "ACTIVE", batchId: null },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { student: true, program: true }
    }),
    prisma.lead.count({ where: { status: "WON", convertedAt: { gte: today } } })
  ]);

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
  return prisma.admissionApplication.findUnique({
    where: { id: applicationId },
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
