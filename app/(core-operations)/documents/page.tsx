import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CoreDocumentForm } from "@/features/core-operations/components/core-operation-forms";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { requirePermission } from "@/server/auth/authorization";
import { getCoreOperationOptions, getDocumentDirectory } from "@/server/core-operations/queries";

export default async function DocumentsPage() {
  const actor = await requirePermission(PERMISSIONS.DOCUMENTS_READ);
  const [documents, options] = await Promise.all([getDocumentDirectory(), hasPermission(actor, PERMISSIONS.DOCUMENTS_MANAGE) ? getCoreOperationOptions(PERMISSIONS.DOCUMENTS_MANAGE) : null]);
  return <div className="space-y-8"><PageHeader title="Core Documents" subtitle="Authorized metadata registry and immutable version history. Storage references remain server-side." />{options ? <Card><CardContent className="p-6"><h2 className="mb-5 text-2xl font-black">Register document</h2><CoreDocumentForm options={options} /></CardContent></Card> : null}<div className="grid gap-4 lg:grid-cols-2">{documents.map((document) => <Link key={document.id} href={`/documents/${document.id}`}><Card className="h-full transition hover:border-brand-red"><CardContent className="p-6"><div className="flex items-start gap-4"><FileText className="mt-1 h-6 w-6 text-brand-red" /><div><p className="text-xs font-black uppercase text-brand-red">{document.category} · {document.status}</p><h2 className="mt-2 text-2xl font-black">{document.displayName}</h2><p className="mt-2 font-bold text-brand-muted">{document.code} · {document.institution.name}</p><p className="mt-2 text-sm font-semibold text-brand-muted">Version {document.versions[0]?.version ?? 0} · {document.versions[0]?.mimeType ?? "No version"}</p></div></div></CardContent></Card></Link>)}{documents.length === 0 ? <Card><CardContent className="p-6 font-bold text-brand-muted">No authorized documents.</CardContent></Card> : null}</div></div>;
}
