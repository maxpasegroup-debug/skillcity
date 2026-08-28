import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceForm, PaymentForm } from "@/features/admissions/components/admission-forms";
import { DirectorPageHeader } from "@/features/director/components/director-page-header";
import { prisma } from "@/lib/prisma";
import { getAdmissionData, getAdmissionsOperationalLists } from "@/server/admissions/queries";

export default async function PaymentsPage() {
  const [{ leads, programs, batches }, [, , invoices], students] = await Promise.all([
    getAdmissionData(),
    getAdmissionsOperationalLists(),
    prisma.user.findMany({
      where: { roles: { some: { role: { name: "Student" } } } },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div className="space-y-10">
      <DirectorPageHeader
        eyebrow="Payments"
        title="Invoices and transactions"
        description="Provider-neutral architecture for Razorpay, Stripe, manual payments, scholarships, discounts, installments, GST, receipts, and invoices."
      />

      <Card>
        <CardContent className="p-6">
          <InvoiceForm leads={leads} students={students} programs={programs} batches={batches} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <PaymentForm invoices={invoices.map((invoice) => ({ id: invoice.id, name: `${invoice.invoiceNo} - INR ${invoice.total}` }))} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="p-6">
              <p className="text-sm font-black text-brand-red">{invoice.status}</p>
              <h3 className="mt-2 text-2xl font-black text-brand-dark">{invoice.invoiceNo}</h3>
              <p className="mt-2 font-bold text-brand-muted">
                INR {invoice.total} - {invoice.lead?.name ?? invoice.student?.name ?? "Unlinked"}
              </p>
              <Button asChild variant="secondary" className="mt-4">
                <Link href="/admissions/action-queue">Open admission action queue</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
