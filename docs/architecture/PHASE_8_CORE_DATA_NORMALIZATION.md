# Phase 8 Core Data Normalization

No historical records were modified. Run `npm run audit:core-operations` only after a safe database environment is confirmed.

## Documents

| Existing data | Decision | Reason / next action |
| --- | --- | --- |
| `StudentDocument` with `fileUrl` | KEEP, FUTURE MIGRATION | Admissions remains operational. Inventory ownership, URL accessibility, duplicates, MIME/size/checksum, and organization scope before creating CoreDocument versions. |
| Resource/video/file URL fields | KEEP | Learning references may not be private documents. Classify before migration. |
| Resume, certificate, portfolio URLs | KEEP | Domain evidence remains authoritative; participant consent and storage privacy require review. |
| `StorageProvider` configuration | EXTEND LATER | No active secure adapter or signed access service is established. Do not infer security from a provider row. |
| New `CoreDocument` records | AUTHORITATIVE GOING FORWARD | Use for shared internal documents after migration deployment. |

Safe automatic work after review: populate deterministic metadata only when source ownership, organization, provider, and object reference are all verified. No current legacy source meets that contract without database inventory.

Manual review required: public URL exposure, missing owner/scope, expired links, duplicate files, sensitive identity records, retention classification, and invalid/unreachable objects.

## Compliance

No authoritative compliance/legal register was found. Recruitment consent timestamps and marketplace approvals remain domain events, not compliance records.

- KEEP existing consent, approval, audit, and policy page evidence in its domain.
- Do not synthesize compliance records from filenames, notes, or application status.
- New `ComplianceRecord` is authoritative only for records deliberately created through the scoped workflow.

Manual review required: compliance type, subject, responsible employee, reviewer, effective/expiry dates, waiver basis, and required documents.

## Finance

| Existing data | Decision | Reason / next action |
| --- | --- | --- |
| `FeeInvoice` | KEEP / EXTEND | Authoritative operational invoice. New direct scope/currency fields are additive. |
| `PaymentTransaction` | KEEP / EXTEND | Authoritative captured/verified payment record. New actor fields are additive. |
| Admissions invoice/payment actions | KEEP | Existing approved-application activation path remains authoritative. |
| Executive finance aggregates | KEEP WITH LIMITATION | Based on authoritative records, but refunds are currently a literal zero and must not be presented as verified refund accounting. |
| `Wallet` / `WalletTransaction` | KEEP SEPARATE | Skill Coins/XP rewards, not money or ledger entries. |
| `CommissionRecord` | KEEP SEPARATE | BDM commission workflow, not payment settlement or accounting. |
| Refunds | NOT IMPLEMENTED | Do not infer refunds from `PaymentStatus.REFUNDED` without reviewed source records/workflow. |

Safe automatic work after database inventory: backfill direct invoice scope only from a single unambiguous Program/Batch/Lead organization path; set `issuedAt` from existing evidence only; retain default INR only where historical business data confirms INR.

Manual review required: invoices with conflicting relationships, currencies other than verified INR, missing provider references, duplicated references, overpayments, refunded status, payments without verification metadata, and historical invoices without a unique organization path.

Blocked until a safe database is available: counts, duplicate detection, URL/provider validation, scope backfill classification, and payment/invoice reconciliation.
