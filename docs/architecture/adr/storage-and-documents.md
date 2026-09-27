# ADR-005: Storage and Documents

- Status: Proposed
- Date: 2026-09-27

## Context

`StudentDocument.fileUrl` and other resource/resume fields store URLs. The application has no active object-storage provider, upload flow, signed URL service, ACL, malware scan, retention policy or secure deletion process.

## Decision

Introduce a Documents domain backed by an object-storage adapter. Database records store provider-neutral object keys and metadata, not permanent public URLs. Reads issue short-lived signed access only after authorization. Verification status is independent from storage state.

## Required Metadata and Controls

- Owner domain/resource and organization scope.
- Object key, provider, media type, size and checksum.
- Original display name with safe server-generated storage names.
- Upload actor/time, verification actor/time and rejection reason.
- Classification, ACL/policy, retention and expiry.
- Malware-scan status and quarantine state.
- Version/replacement relationship and immutable audit events.

## Unresolved Decisions

- Storage provider and region/data-residency requirements.
- Direct-to-storage versus server-proxied upload.
- Maximum sizes/types and image/document transformations.
- Legal retention and user deletion rules.
- Migration and validation of existing URLs.

## Consequences

Existing URL fields remain in Phase 0. Migration must support dual read during transition and must never expose private object keys as public URLs.

## Phase 1 Boundary

Document metadata lists and mutations are now authorized through the related admission application or student enrollment. No download endpoint or storage provider was added. Existing `fileUrl` values therefore remain a security and data-classification risk until this ADR is implemented.
