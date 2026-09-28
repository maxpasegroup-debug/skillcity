# Phase 8 Core Documents Architecture

## Decision

`CoreDocument` is the shared AIRA metadata and authorization record for future HR, CRM, Admissions, Learning, Skill Studio, Career Hub, Labs, Finance, and Compliance documents. `StudentDocument` remains the legacy admissions record until its public URL data can be inspected and migrated safely.

## Model

- `CoreDocument` owns stable code, display name, classification, lifecycle, access policy, owner, organization scope, retention date, and audit identity.
- `CoreDocumentVersion` preserves immutable provider-neutral versions. It stores provider, private object reference, MIME type, filename, size, and optional checksum.
- `CoreDocumentContextLink` links one central document to an authorized domain context without creating domain-specific document tables.
- `ComplianceDocument` is an association, not another document identity.

Important records are archived rather than deleted. Version rows and context links use restrictive deletes.

## Storage Boundary

No active secure object-storage adapter, upload session, malware scanner, signed URL endpoint, or retention worker exists. Phase 8 stores provider-neutral references so business code does not depend on Cloudinary, local paths, or permanent URLs. List/detail presentation deliberately excludes `storageKey`; no download link is exposed.

Existing `StudentDocument.fileUrl`, resource URLs, resume URLs, certificate URLs, and portfolio URLs remain in place. Their accessibility cannot be inferred from the URL and must be inventoried before migration.

## Access

Policies are `PRIVATE`, `OWNER`, `ORGANIZATION`, and `AUTHORIZED_CONTEXT`. Server predicates combine permission, effective organization scope, and owner identity. Context IDs are resolved through resource-specific authorization before a link is written. Knowing a document UUID or storage reference does not grant access.

Permissions are `documents.read` and `documents.manage`. Records Manager receives organization scope. Admin, Director, CEO, and COO receive global scope. Students and unrelated operational roles receive no implicit access.

## Audit

Creation, version creation, and archive operations write `PlatformAudit` in the same transaction as their primary mutation. No separate document audit framework was introduced.

## Deferred

- Storage-provider selection and credentials
- Signed downloads and upload sessions
- Malware scanning and quarantine processing
- Legal retention automation and secure deletion
- Legacy URL migration and dual-read behavior
- Participant-facing document sharing
