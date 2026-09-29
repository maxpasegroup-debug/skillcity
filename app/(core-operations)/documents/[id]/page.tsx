import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getCoreDocumentDetail } from "@/server/core-operations/queries";
import { isPrivateDocumentDeliveryConfigured } from "@/server/documents/private-storage";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getCoreDocumentDetail(id);
  if (!document) notFound();

  return (
    <div className="space-y-8">
      <PageHeader title={document.displayName} subtitle={`${document.code} / ${document.category} / ${document.status}`} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardContent className="p-6"><h2 className="text-xl font-black">Access and ownership</h2><dl className="mt-4 space-y-2 font-semibold text-brand-muted"><div>Policy: {document.accessPolicy}</div><div>Organization: {document.institution.name}</div><div>Owner: {document.owner?.name ?? "Organization record"}</div><div>Created by: {document.createdBy.name}</div><div>Retention: {document.retentionUntil?.toLocaleDateString() ?? "Not defined"}</div></dl></CardContent></Card>
        <Card><CardContent className="p-6"><h2 className="text-xl font-black">Authorized contexts</h2><div className="mt-4 space-y-2">{document.contextLinks.map((link) => <p key={link.id} className="font-semibold text-brand-muted">{link.contextType}: {link.contextId}</p>)}{document.contextLinks.length === 0 ? <p className="font-semibold text-brand-muted">No context links.</p> : null}</div></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-black">Version history</h2>
          <div className="mt-4 divide-y divide-black/10">
            {document.versions.map((version) => (
              <div key={version.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-black">Version {version.version} / {version.originalFilename}</p><p className="mt-1 text-sm font-semibold text-brand-muted">{version.mimeType} / {version.sizeBytes ?? "Unknown"} bytes / {version.storageProvider} / uploaded by {version.uploadedBy.name}</p></div>
                {document.status === "ACTIVE" && document.accessPolicy === "PRIVATE" && isPrivateDocumentDeliveryConfigured(version.storageProvider) ? <Button asChild variant="secondary"><Link href={`/api/documents/${document.id}/versions/${version.id}/download`}><Download className="h-4 w-4" />Download</Link></Button> : null}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-brand-muted">Private storage keys are not displayed. Downloads are available only through the authorized short-lived delivery route when a matching provider is configured.</p>
        </CardContent>
      </Card>
    </div>
  );
}
