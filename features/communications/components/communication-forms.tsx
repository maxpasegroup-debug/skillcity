"use client";

import { useActionState } from "react";
import { createCommunicationTemplateAction, createEventAutomationAction, processPendingEventsAction } from "@/actions/communications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState = { ok: false, message: "" };
type Option = { id: string; name: string };

function Select({ name, label, children, required }: { name: string; label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><select name={name} required={required} className="h-12 w-full rounded-lg border border-black/10 bg-white px-4 font-semibold text-brand-dark">{children}</select></label>;
}

function Textarea({ name, label, required, rows = 4 }: { name: string; label: string; required?: boolean; rows?: number }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-brand-dark">{label}</span><textarea name={name} required={required} rows={rows} className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-base text-brand-dark" /></label>;
}

function Result({ state }: { state: typeof initialState }) {
  return state.message ? <p className={state.ok ? "font-bold text-emerald-700" : "font-bold text-brand-red"}>{state.message}</p> : null;
}

export function CommunicationTemplateForm({ institutions }: { institutions: Option[] }) {
  const [state, action, pending] = useActionState(createCommunicationTemplateAction, initialState);
  return <form action={action} className="space-y-5"><Result state={state} /><div className="grid gap-4 md:grid-cols-3"><Select name="institutionId" label="Organization" required><option value="">Choose organization</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input name="code" label="Template Code" required /><Input name="name" label="Template Name" required /><Select name="channel" label="Channel" required><option value="INTERNAL_NOTIFICATION">In-app</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option></Select><Select name="purpose" label="Purpose" required><option value="OPERATIONAL">Operational</option><option value="TRANSACTIONAL">Transactional</option><option value="MARKETING">Marketing</option></Select><Input name="locale" label="Locale" defaultValue="en" required /></div><Input name="subject" label="Subject" /><Textarea name="body" label="Body" rows={6} required /><Input name="providerTemplateId" label="Provider Template ID" /><Button disabled={pending}>{pending ? "Creating..." : "Create Template"}</Button></form>;
}

export function EventAutomationForm({ institutions }: { institutions: Option[] }) {
  const [state, action, pending] = useActionState(createEventAutomationAction, initialState);
  return <form action={action} className="space-y-5"><Result state={state} /><div className="grid gap-4 md:grid-cols-3"><Select name="institutionId" label="Organization" required><option value="">Choose organization</option>{institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Input name="code" label="Automation Code" required /><Input name="name" label="Automation Name" required /><Select name="eventType" label="Event" required><option value="lead.created">Lead created</option><option value="career.application.submitted">Career application submitted</option><option value="payment.confirmed">Payment confirmed</option></Select><Select name="recipientPayloadKey" label="Recipient" required><option value="recipientUserId">Event recipient</option></Select><Input name="maxAttempts" label="Max Attempts" type="number" min="1" max="5" defaultValue="3" required /></div><Textarea name="description" label="Description" /><Input name="title" label="Notification Title" required /><Textarea name="message" label="Notification Message" required /><Input name="actionUrl" label="Action URL" /><Button disabled={pending}>{pending ? "Creating..." : "Create Automation"}</Button></form>;
}

export function ProcessEventsForm() {
  const [state, action, pending] = useActionState(processPendingEventsAction, initialState);
  return <form action={action} className="flex flex-wrap items-end gap-4"><input type="hidden" name="limit" value="10" /><Button disabled={pending}>{pending ? "Processing..." : "Process Pending Events"}</Button><Result state={state} /></form>;
}
