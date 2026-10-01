import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CommercialDocumentForm } from "@/features/labs/components/commercial-document-form";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/server/auth/authorization";

export default async function LabsCommercialPage() {
  await requirePermission(PERMISSIONS.LABS_COMMERCIAL_MANAGE, "/aira-labs/sign-in");
  const documents = await prisma.labsCommercialDocument.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="space-y-10"><header><p className="text-sm font-black uppercase text-brand-red">AIRA Labs commercial desk</p><h1 className="mt-3 text-4xl font-black">Quotations & invoices</h1><p className="mt-3 max-w-3xl font-semibold leading-7 text-brand-muted">Create custom service documents issued only by AIRASKILLCITY PRIVATE LIMITED, with optional GST and immediate PDF download.</p></header>
    <Card><CardContent className="p-6 md:p-8"><h2 className="mb-6 text-2xl font-black">Create document</h2><CommercialDocumentForm /></CardContent></Card>
    <section><div className="mb-5 flex items-center gap-3"><FileText className="h-6 w-6 text-brand-red" /><h2 className="text-2xl font-black">Recent documents</h2></div>{documents.length ? <div className="grid gap-4 md:grid-cols-2">{documents.map((document) => <Card key={document.id}><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="text-xs font-black uppercase text-brand-red">{document.type} · {document.number}</p><h3 className="mt-2 font-black">{document.customerName}</h3><p className="mt-1 text-sm font-semibold text-brand-muted">{document.service.replaceAll("_", " ")} · INR {Number(document.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></div><Button asChild variant="secondary" className="h-10 px-3"><Link href={`/api/labs/commercial/${document.id}/pdf`} aria-label={`Download ${document.number}`}><Download className="h-4 w-4" /></Link></Button></CardContent></Card>)}</div> : <p className="rounded-lg border border-dashed border-black/20 p-6 font-semibold text-brand-muted">No commercial documents created yet.</p>}</section>
  </div>;
}
