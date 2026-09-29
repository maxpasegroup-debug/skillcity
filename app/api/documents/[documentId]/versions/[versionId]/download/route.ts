import { NextResponse } from "next/server";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { coreDocumentScopeWhere } from "@/server/auth/scoping";
import { createPrivateDocumentDownloadUrl, PrivateDocumentStorageUnavailableError } from "@/server/documents/private-storage";

const notFound = () => NextResponse.json({ error: "Document not found" }, { status: 404 });

export async function GET(_: Request, context: { params: Promise<{ documentId: string; versionId: string }> }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!hasPermission(actor, PERMISSIONS.DOCUMENTS_READ)) return notFound();

  const { documentId, versionId } = await context.params;
  const document = await prisma.coreDocument.findFirst({
    where: { AND: [{ id: documentId, status: "ACTIVE", accessPolicy: "PRIVATE" }, coreDocumentScopeWhere(actor, PERMISSIONS.DOCUMENTS_READ)] },
    select: { id: true, versions: { where: { id: versionId }, take: 1, select: { id: true, storageProvider: true, storageKey: true } } }
  });
  const version = document?.versions[0];
  if (!document || !version) return notFound();

  try {
    const location = createPrivateDocumentDownloadUrl(version);
    await prisma.platformAudit.create({ data: { actorId: actor.id, action: "DOCUMENT_DOWNLOAD_LINK_ISSUED", entity: "CoreDocumentVersion", entityId: version.id, metadata: { documentId: document.id } } });
    return NextResponse.redirect(location, { status: 307, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof PrivateDocumentStorageUnavailableError) {
      return NextResponse.json({ error: "Secure document delivery is unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
    }
    throw error;
  }
}
