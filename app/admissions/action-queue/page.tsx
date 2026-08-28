import Link from "next/link";
import { CheckCircle2, CreditCard, GraduationCap, Receipt, UserCheck, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManualPaymentCaptureForm, PaymentVerificationForm } from "@/features/admissions/components/phase4-forms";
import { DirectorMetricCard } from "@/features/director/components/director-metric-card";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionPhase4Queue } from "@/server/admissions/phase4-queries";

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function AdmissionActionQueuePage() {
  const queue = await getAdmissionPhase4Queue();
  const invoiceOptions = queue.paymentPendingInvoices.map((invoice) => ({ id: invoice.id, name: `${invoice.invoiceNo} - INR ${invoice.total} - ${invoice.lead?.name ?? invoice.student?.name ?? "Candidate"}` }));

  return (
    <div className="space-y-10">
      <DirectorPageHeader eyebrow="Admission Queue" title="Payment to student activation" description="Review applications, request payment, verify received payments, confirm admission, and activate student accounts." />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DirectorMetricCard label="Applications" value={queue.stats.applications} icon={Users} />
        <DirectorMetricCard label="Pending Review" value={queue.stats.pendingReview} icon={CheckCircle2} />
        <DirectorMetricCard label="Payment Pending" value={queue.stats.paymentPending} icon={Receipt} />
        <DirectorMetricCard label="Payment Verification" value={queue.stats.paymentVerification} icon={CreditCard} />
        <DirectorMetricCard label="Admission Confirmed" value={queue.stats.admissionConfirmed} icon={GraduationCap} />
        <DirectorMetricCard label="Student Activation Pending" value={queue.stats.studentActivationPending} icon={UserCheck} />
        <DirectorMetricCard label="Batch Assignment Pending" value={queue.stats.batchAssignmentPending} icon={GraduationCap} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <QueueSection title="Applications awaiting review">
            {queue.applicationsAwaitingReview.map((application) => (
              <QueueItem key={application.id} title={application.lead.name} eyebrow={application.status} detail={`${application.program.name} - ${application.documents.length} documents`}>
                <Button asChild variant="secondary"><Link href={`/admissions/applications/${application.id}`}>View</Link></Button>
              </QueueItem>
            ))}
            {queue.applicationsAwaitingReview.length === 0 ? <EmptyLine text="No applications waiting for review." /> : null}
          </QueueSection>

          <QueueSection title="Approved candidates">
            {queue.approvedApplications.map((application) => {
              const paidInvoice = application.lead.invoices.find((invoice) => invoice.status === "PAID");
              const pendingInvoice = application.lead.invoices.find((invoice) => invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID");
              const nextAction = application.student ? "Student active" : paidInvoice ? "Confirm admission" : pendingInvoice ? "Collect payment" : "Create payment request";
              return (
                <QueueItem key={application.id} title={application.lead.name} eyebrow={nextAction} detail={`${application.program.name} - ${application.lead.assignedTo?.name ?? "Unassigned"}`}>
                  <Button asChild><Link href={`/admissions/applications/${application.id}`}>Open</Link></Button>
                </QueueItem>
              );
            })}
            {queue.approvedApplications.length === 0 ? <EmptyLine text="No approved candidates yet." /> : null}
          </QueueSection>

          <QueueSection title="Payment pending">
            {queue.paymentPendingInvoices.map((invoice) => (
              <QueueItem key={invoice.id} title={invoice.lead?.name ?? invoice.student?.name ?? invoice.invoiceNo} eyebrow={invoice.status} detail={`${invoice.program?.name ?? "Program"} - INR ${invoice.total} - due ${formatDate(invoice.dueAt)}`}>
                {invoice.lead?.applications?.[0] ? <Button asChild variant="secondary"><Link href={`/admissions/applications/${invoice.lead.applications[0].id}`}>View</Link></Button> : null}
              </QueueItem>
            ))}
            {queue.paymentPendingInvoices.length === 0 ? <EmptyLine text="No pending invoices." /> : null}
          </QueueSection>

          <QueueSection title="Student activation pending">
            {queue.activationCandidates.map((application) => (
              <QueueItem key={application.id} title={application.lead.name} eyebrow="Payment verified" detail={`${application.program.name} - ready to activate`}>
                <Button asChild><Link href={`/admissions/applications/${application.id}`}>Activate</Link></Button>
              </QueueItem>
            ))}
            {queue.activationCandidates.length === 0 ? <EmptyLine text="No paid candidates waiting for activation." /> : null}
          </QueueSection>

          <QueueSection title="Batch assignment pending">
            {queue.batchPending.map((enrollment) => (
              <QueueItem key={enrollment.id} title={enrollment.student.name} eyebrow="Batch pending" detail={enrollment.program.name}>
                <Button asChild variant="secondary"><Link href="/admissions/enrollments">View</Link></Button>
              </QueueItem>
            ))}
            {queue.batchPending.length === 0 ? <EmptyLine text="No active students waiting for batch assignment." /> : null}
          </QueueSection>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Record payment</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-brand-muted">Manual/offline payments are saved as verification pending.</p>
              <div className="mt-5">
                <ManualPaymentCaptureForm invoices={invoiceOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Verify payments</h2>
              <div className="mt-5 space-y-4">
                {queue.paymentVerificationPending.map((payment) => (
                  <div key={payment.id} className="rounded-lg bg-brand-card p-4">
                    <p className="font-black text-brand-dark">{payment.invoice.lead?.name ?? payment.invoice.invoiceNo}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">INR {payment.amount} - {payment.providerRef ?? "No reference"}</p>
                    <div className="mt-4">
                      <PaymentVerificationForm paymentId={payment.id} />
                    </div>
                  </div>
                ))}
                {queue.paymentVerificationPending.length === 0 ? <EmptyLine text="No payments waiting for verification." /> : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function QueueSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-black text-brand-dark">{title}</h2>
        <div className="mt-5 space-y-3">{children}</div>
      </CardContent>
    </Card>
  );
}

function QueueItem({ title, eyebrow, detail, children }: { title: string; eyebrow: string; detail: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4">
      <div>
        <p className="text-sm font-black text-brand-red">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-black text-brand-dark">{title}</h3>
        <p className="mt-1 text-sm font-bold text-brand-muted">{detail}</p>
      </div>
      {children}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="font-semibold text-brand-muted">{text}</p>;
}
