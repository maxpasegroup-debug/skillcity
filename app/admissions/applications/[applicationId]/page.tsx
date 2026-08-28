import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationReviewForm } from "@/features/admissions/components/admission-cell-forms";
import { AdmissionActivationForm, ManualPaymentCaptureForm, PaymentRequestForm, PaymentVerificationForm } from "@/features/admissions/components/phase4-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { getAdmissionPhase4Application } from "@/server/admissions/phase4-queries";

function formatDate(date?: Date | null) {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-1 font-black text-brand-dark">{value || "Not provided"}</p>
    </div>
  );
}

export default async function AdmissionApplicationOperatingPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  const application = await getAdmissionPhase4Application(applicationId);
  if (!application) notFound();

  const invoices = application.lead.invoices;
  const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID");
  const payableInvoices = invoices.filter((invoice) => invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID");
  const pendingPayments = invoices.flatMap((invoice) => invoice.transactions.filter((payment) => (payment.status === "INITIATED" || payment.status === "SUCCESS") && invoice.status !== "PAID").map((payment) => ({ ...payment, invoice })));
  const credential = application.studentLoginCredentials[0];
  const latestCounselling = application.lead.counsellingSessions[0];
  const enrollment = application.student?.enrollments.find((item) => item.programId === application.programId);
  const steps = [
    { label: "Application", done: application.status === "APPROVED" || application.status === "UNDER_REVIEW" || application.status === "SUBMITTED" },
    { label: "Payment", done: application.program.feeType === "FREE" || paidInvoices.length > 0 },
    { label: "Admission", done: application.lead.status === "WON" },
    { label: "Account", done: Boolean(application.studentId) },
    { label: "Batch", done: Boolean(enrollment?.batchId), pending: Boolean(enrollment && !enrollment.batchId) }
  ];

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost">
        <Link href="/admissions/action-queue">
          <ArrowLeft className="h-4 w-4" />
          Back to action queue
        </Link>
      </Button>

      <DirectorPageHeader eyebrow={application.status} title={application.lead.name} description="Admission operating page for application, payment, confirmation, account activation, credentials, onboarding, and batch handoff." />

      <Card>
        <CardContent className="grid gap-3 p-5 sm:grid-cols-5">
          {steps.map((step) => (
            <div key={step.label} className="rounded-lg bg-brand-card p-4">
              {step.done ? <CheckCircle2 className="h-5 w-5 text-brand-red" /> : <CircleDashed className="h-5 w-5 text-brand-muted" />}
              <p className="mt-3 text-sm font-black text-brand-dark">{step.label}</p>
              <p className="mt-1 text-xs font-bold text-brand-muted">{step.done ? "Done" : step.pending ? "Pending" : "Required"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <Row label="Candidate" value={application.lead.name} />
              <Row label="Program" value={application.program.name} />
              <Row label="Phone" value={application.lead.phone} />
              <Row label="WhatsApp" value={application.lead.whatsapp ?? application.lead.phone} />
              <Row label="Application" value={application.status} />
              <Row label="Payment" value={paidInvoices[0]?.status ?? payableInvoices[0]?.status ?? "No invoice"} />
              <Row label="Admission" value={application.lead.status === "WON" ? "Confirmed" : "Not confirmed"} />
              <Row label="Batch" value={enrollment?.batch?.name ?? (enrollment ? "Assignment pending" : "Not enrolled")} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Counselling</h2>
              <div className="mt-5 rounded-lg bg-white p-4">
                <p className="font-black text-brand-dark">{latestCounselling?.outcome ?? "No counselling session"}</p>
                <p className="mt-1 text-sm font-bold text-brand-muted">{formatDate(latestCounselling?.scheduledAt)} by {latestCounselling?.counsellor?.name ?? application.lead.assignedTo?.name ?? "Unassigned"}</p>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-brand-muted">{latestCounselling?.notes ?? "No counselling notes captured."}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Payments</h2>
              <div className="mt-5 space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{invoice.invoiceNo} - {invoice.status}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">INR {invoice.total} - paid {formatDate(invoice.paidAt)}</p>
                    <div className="mt-3 space-y-2">
                      {invoice.transactions.map((payment) => (
                        <p key={payment.id} className="text-sm font-semibold text-brand-muted">{payment.provider} - {payment.status} - INR {payment.amount} - {payment.providerRef ?? "No reference"}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {invoices.length === 0 ? <p className="font-semibold text-brand-muted">No payment request yet.</p> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Account and Onboarding</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Row label="Student Account" value={application.student?.email ?? "Not activated"} />
                <Row label="Credential" value={credential ? `${credential.status}${credential.mustResetPin ? " - PIN reset pending" : ""}` : "Not generated"} />
                <Row label="Onboarding" value={application.student?.activationProfile?.completedAt ? "Profile completed" : application.student ? "Profile pending" : "Not started"} />
                <Row label="Enrollment" value={enrollment ? enrollment.status : "Not created"} />
                <Row label="Journey" value={enrollment?.journey.name} />
                <Row label="Batch" value={enrollment?.batch?.name ?? (enrollment ? "Assignment pending" : "Not assigned")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Activity Timeline</h2>
              <div className="mt-5 space-y-3">
                {application.lead.activities.map((activity) => (
                  <div key={activity.id} className="rounded-lg bg-white p-4">
                    <p className="font-black text-brand-dark">{activity.type.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-sm font-bold text-brand-muted">{formatDate(activity.createdAt)} by {activity.actor?.name ?? "System"}</p>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">{activity.summary}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-black text-brand-dark">Review</h2>
              <div className="mt-5">
                <ApplicationReviewForm applicationId={application.id} defaultStatus={application.status} />
              </div>
            </CardContent>
          </Card>

          {application.status === "APPROVED" && invoices.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-brand-dark">Payment request</h2>
                <div className="mt-5">
                  <PaymentRequestForm applicationId={application.id} />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {payableInvoices.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-brand-dark">Record payment</h2>
                <div className="mt-5">
                  <ManualPaymentCaptureForm invoices={payableInvoices.map((invoice) => ({ id: invoice.id, name: `${invoice.invoiceNo} - INR ${invoice.total}` }))} />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {pendingPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-brand-dark">Verify payment</h2>
                <p className="mt-2 text-sm font-bold text-brand-muted">INR {payment.amount} - {payment.providerRef ?? "No reference"}</p>
                <div className="mt-5">
                  <PaymentVerificationForm paymentId={payment.id} />
                </div>
              </CardContent>
            </Card>
          ))}

          {(application.program.feeType === "FREE" || paidInvoices.length > 0) && !application.studentId ? (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-black text-brand-dark">Confirm admission</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-brand-muted">This activates the student account, creates credentials, starts onboarding, and leaves batch pending if no batch is chosen.</p>
                <div className="mt-5">
                  <AdmissionActivationForm
                    applicationId={application.id}
                    invoices={paidInvoices.map((invoice) => ({ id: invoice.id, name: `${invoice.invoiceNo} - INR ${invoice.total}` }))}
                    batches={application.program.batches.map((batch) => ({ id: batch.id, name: batch.name }))}
                    whatsapp={application.lead.whatsapp ?? application.lead.phone}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}
