import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CommunicationTemplateForm } from "@/features/communications/components/communication-forms";
import { getCommunicationTemplates } from "@/server/communications/queries";

export default async function CommunicationTemplatesPage() {
  const { templates, institutions, canManage } = await getCommunicationTemplates();
  return <div><PageHeader title="Message Templates" subtitle="Versioned, organization-scoped templates. Provider credentials are never stored here." />{canManage ? <Card><CardContent className="p-6"><CommunicationTemplateForm institutions={institutions} /></CardContent></Card> : null}<div className="mt-8 grid gap-4 lg:grid-cols-2">{templates.map((template) => <Card key={template.id}><CardContent className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-black uppercase text-brand-red">{template.code}</p><span className="text-sm font-bold">{template.status}</span></div><h2 className="mt-2 text-xl font-black">{template.name}</h2><p className="mt-2 text-sm text-brand-muted">{template.channel} · {template.purpose} · {template.institution?.name ?? "Global"} · v{template.versions[0]?.version ?? 0}</p></CardContent></Card>)}</div></div>;
}
