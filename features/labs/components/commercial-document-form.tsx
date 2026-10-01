"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { createLabsCommercialDocumentAction } from "@/actions/labs-commercial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/features/auth/components/form-message";

const initialState: { ok: boolean; message: string; id?: string } = { ok: false, message: "" };
const field = "h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10";

export function CommercialDocumentForm() {
  const [state, action, pending] = useActionState(createLabsCommercialDocumentAction, initialState);
  const downloadedId = useRef<string | null>(null);
  useEffect(() => {
    if (!state.ok || !state.id || downloadedId.current === state.id) return;
    downloadedId.current = state.id;
    const download = document.createElement("a");
    download.href = `/api/labs/commercial/${state.id}/pdf`;
    download.click();
  }, [state.id, state.ok]);
  return <form action={action} className="space-y-6"><FormMessage message={state.message} ok={state.ok} />
    {state.ok && state.id ? <Button asChild variant="secondary"><Link href={`/api/labs/commercial/${state.id}/pdf`}><Download className="h-4 w-4" />Download PDF</Link></Button> : null}
    <div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold">Document type</span><select name="type" className={field}><option value="QUOTATION">Quotation</option><option value="INVOICE">Invoice</option></select></label><Input name="number" label="Document number" placeholder="AL/Q/2026/001" required /></div>
    <div className="grid gap-4 md:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold">Service</span><select name="service" className={field}><option value="AI_POWERED_SIGNATURE_OS">AI Powered Signature OS</option><option value="TALKIN_LABS">Talkin Labs</option><option value="CUSTOM">Custom service</option></select></label><Input name="validUntil" label="Valid until" type="date" /></div>
    <div className="grid gap-4 md:grid-cols-2"><Input name="customerName" label="Customer name" required /><Input name="customerPhone" label="Customer mobile" inputMode="tel" /><Input name="customerEmail" label="Customer email" type="email" /><Input name="customerGstin" label="Customer GSTIN" /></div>
    <label className="block"><span className="mb-2 block text-sm font-bold">Customer address</span><textarea name="customerAddress" rows={3} className={`${field} h-auto py-3`} /></label>
    <label className="block"><span className="mb-2 block text-sm font-bold">Service description</span><textarea name="description" rows={4} className={`${field} h-auto py-3`} placeholder="Setup, onboarding, WhatsApp API top-up, automation or other scope" required /></label>
    <div className="grid gap-4 sm:grid-cols-3"><Input name="quantity" label="Quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /><Input name="unitPrice" label="Custom amount (INR)" type="number" min="0" step="0.01" required /><Input name="gstRate" label="GST rate %" type="number" min="0" max="100" step="0.01" defaultValue="18" /></div>
    <label className="flex items-center gap-3 font-bold"><input type="checkbox" name="gstApplicable" className="h-5 w-5 accent-brand-red" />Apply GST</label>
    <div className="grid gap-4 md:grid-cols-2"><Input name="issuerGstin" label="AIRA GSTIN" /><label className="block"><span className="mb-2 block text-sm font-bold">Registered address</span><textarea name="issuerAddress" rows={3} className={`${field} h-auto py-3`} /></label></div>
    <label className="block"><span className="mb-2 block text-sm font-bold">Notes / terms</span><textarea name="notes" rows={3} className={`${field} h-auto py-3`} /></label>
    <Button size="lg" disabled={pending}>{pending ? "Creating..." : "Create document"}</Button>
  </form>;
}
