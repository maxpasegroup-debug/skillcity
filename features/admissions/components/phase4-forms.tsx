"use client";

import { useActionState } from "react";
import { CheckCircle2, CreditCard, GraduationCap, Receipt } from "lucide-react";
import { confirmAdmissionAndActivateStudentAction, captureManualPaymentAction, createPaymentRequestForApplicationAction, verifyPaymentAction } from "@/actions/admission-phase4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectorFormMessage } from "@/features/director/components/director-form-message";

const initialState = { ok: false, message: "" };

type Option = { id: string; name: string };

export function PaymentRequestForm({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState(createPaymentRequestForApplicationAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="subtotal" label="List price" type="number" defaultValue={0} min={0} required />
        <Input name="discount" label="Discount" type="number" defaultValue={0} min={0} />
        <Input name="scholarship" label="Scholarship" type="number" defaultValue={0} min={0} />
        <Input name="gst" label="GST" type="number" defaultValue={0} min={0} />
      </div>
      <Input name="dueAt" label="Due date" type="date" />
      <Textarea name="note" label="Payment note" rows={2} />
      <Button disabled={pending} className="w-full">
        <Receipt className="h-5 w-5" />
        {pending ? "Creating..." : "Create payment request"}
      </Button>
    </form>
  );
}

export function ManualPaymentCaptureForm({ invoices }: { invoices: Option[] }) {
  const [state, action, pending] = useActionState(captureManualPaymentAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <Select name="invoiceId" label="Invoice" required>
        {invoices.map((invoice) => (
          <option key={invoice.id} value={invoice.id}>{invoice.name}</option>
        ))}
      </Select>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="amount" label="Amount received" type="number" min={1} required />
        <Select name="provider" label="Method" required>
          <option value="MANUAL">Manual / Bank</option>
          <option value="RAZORPAY">Razorpay</option>
          <option value="STRIPE">Stripe</option>
          <option value="SCHOLARSHIP">Scholarship</option>
        </Select>
      </div>
      <Input name="providerRef" label="Reference number" required />
      <Input name="paidAt" label="Paid at" type="datetime-local" />
      <Textarea name="note" label="Payment note" rows={2} />
      <Button disabled={pending} className="w-full">
        <CreditCard className="h-5 w-5" />
        {pending ? "Recording..." : "Record payment for verification"}
      </Button>
    </form>
  );
}

export function PaymentVerificationForm({ paymentId }: { paymentId: string }) {
  const [state, action, pending] = useActionState(verifyPaymentAction, initialState);
  return (
    <form action={action} className="space-y-3">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="paymentId" value={paymentId} />
      <Select name="decision" label="Verification" required>
        <option value="VERIFIED">Verified</option>
        <option value="FAILED">Failed</option>
        <option value="REFUNDED">Refunded</option>
      </Select>
      <Textarea name="note" label="Verification note" rows={2} />
      <Button disabled={pending} className="w-full">
        <CheckCircle2 className="h-5 w-5" />
        {pending ? "Saving..." : "Save verification"}
      </Button>
    </form>
  );
}

export function AdmissionActivationForm({ applicationId, invoices, batches, whatsapp }: { applicationId: string; invoices: Option[]; batches: Option[]; whatsapp: string }) {
  const [state, action, pending] = useActionState(confirmAdmissionAndActivateStudentAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <DirectorFormMessage message={state.message} ok={state.ok} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <Input name="whatsapp" label="Student WhatsApp" defaultValue={whatsapp} required />
      <Select name="invoiceId" label="Verified invoice">
        <option value="">Free program / choose automatically</option>
        {invoices.map((invoice) => (
          <option key={invoice.id} value={invoice.id}>{invoice.name}</option>
        ))}
      </Select>
      <Select name="batchId" label="Batch">
        <option value="">Batch assignment pending</option>
        {batches.map((batch) => (
          <option key={batch.id} value={batch.id}>{batch.name}</option>
        ))}
      </Select>
      <Button disabled={pending} className="w-full">
        <GraduationCap className="h-5 w-5" />
        {pending ? "Activating..." : "Confirm admission and activate"}
      </Button>
    </form>
  );
}

function Select({ name, label, children, required }: { name: string; label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <select name={name} required={required} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 text-base font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10">
        {children}
      </select>
    </label>
  );
}

function Textarea({ name, label, rows }: { name: string; label: string; rows: number }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span>
      <textarea name={name} rows={rows} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10" />
    </label>
  );
}
