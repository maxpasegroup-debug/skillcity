# Admissions Consolidation Plan

Status: analysis only; no admissions refactor performed in Phase 0.

## Current Responsibility Map

| Area | Current owner(s) | Mutations / side effects |
| --- | --- | --- |
| Lead creation | `actions/admissions.ts`, `actions/public-application.ts` | Lead/source/program/pipeline records, lead activity |
| Application creation | Same files | `AdmissionApplication`, pipeline movement, referral link |
| Review decision | `actions/admissions.ts` | Application status, lead stage/activity/note |
| Payment request | `actions/admissions.ts`, `actions/admission-phase4.ts` | Invoice creation; phase 4 also moves pipeline and logs activity |
| Payment capture | Both files | Payment transaction; phase 4 adds duplicate detection and pending-verification state |
| Payment verification | `actions/admission-phase4.ts` | Transaction/invoice/lead/audit updates |
| Student activation | `generateStudentCredentialAction` and `confirmAdmissionAndActivateStudentAction` | User, role, credential, profile, application, enrollment, lead, audit, WhatsApp |
| Enrollment conversion | `convertPaidLeadToEnrollmentAction`, phase 4 activation | User/enrollment/lead mutations |
| Batch assignment | `actions/admission-phase5.ts` | Enrollment, lead, notification and audit updates |
| Read/query views | Three `server/admissions/*queries.ts` files | Phase 4/5 queries are read-only; base queries bootstrap pipeline/source |

## Duplicated and Overlapping Responsibilities

### Payment

- `createInvoiceAction` creates generic invoices directly from form data.
- `createPaymentRequestForApplicationAction` creates an application-bound invoice, computes total, prevents one class of duplicate, moves pipeline state and logs activity.
- `recordPaymentAction` can record arbitrary payment status directly.
- `captureManualPaymentAction` records an `INITIATED` payment with provider-reference deduplication and verification metadata.

The phase 4 path contains stronger invariants. The older generic path can bypass verification and pipeline/audit behavior.

### Activation and Enrollment

- `generateStudentCredentialAction` creates/updates the student, role, activation profile, enrollment, credential, lead and audit records, then sends WhatsApp.
- `confirmAdmissionAndActivateStudentAction` performs substantially the same orchestration, with explicit invoice/free-program checks and optional batch assignment.
- `convertPaidLeadToEnrollmentAction` creates a student and enrollment from an invoice through a third, thinner path.

These flows can produce different credential, audit, enrollment, and payment prerequisites for the same business outcome.

### Pipeline Lookup and Setup

All three action modules call `ensureDefaultPipeline()` directly or through `stageId()`. That helper both discovers and mutates reference data. Business actions therefore depend on runtime setup behavior, and read modules invoke the same mutation.

### Shared Utilities

WhatsApp normalization, PIN creation, nullable form conversion, dates, invoice totals and stage lookup are local/private helpers repeated across action modules. These are business-policy candidates, but they should only be extracted as part of the consolidation so duplicate flows do not become more entrenched.

## Phase Boundaries

- **Base/legacy actions:** broad CRUD and operational controls in `actions/admissions.ts`.
- **Phase 4:** review-to-payment-to-admission-confirmation orchestration.
- **Phase 5:** post-activation batch assignment and onboarding handoff.
- **Public application:** unauthenticated lead/application intake and status lookup.

The numbered phase files describe delivery history, not stable domain ownership. Future structure should use business capability names.

## Authorization

- Internal admissions mutations generally call `requireAdmissionUser()`.
- `createCommissionAction` calls `requireBdmUser()`.
- Public application/status actions are intentionally unauthenticated and rely on in-memory rate limiting.
- Authorization is role-name based and does not enforce organization/lead scope.
- Direct conversion and activation paths need one policy contract so payment/application scope cannot diverge.

## Database Mutations

Admissions orchestration writes across `Lead`, `LeadActivity`, `LeadNote`, `AdmissionApplication`, `FeeInvoice`, `PaymentTransaction`, `User`, `Role`, `UserRole`, `StudentActivationProfile`, `StudentLoginCredential`, `StudentEnrollment`, `EnrollmentLog`, `Referral`, `CommissionRecord`, `CommunicationLog`, `Notification`, and `AuditLog`.

Cross-domain writes are currently performed in shared Prisma transactions. Transactions are valuable and should be retained until equivalent event/outbox guarantees exist. Consolidation must preserve idempotency and atomicity before changing ownership.

## External Side Effects

- Credential activation sends a WhatsApp message after the database transaction. Failure leaves activated data without guaranteed delivery/retry.
- Email is not central to the inspected admissions phase flows.
- Payments are database records only; no gateway side effect or webhook exists.
- Revalidation affects multiple admissions, admin, director and student routes.

## Recommended Future Ownership

1. `admissions/intake`: public/internal lead and application capture.
2. `admissions/review`: counselling, review decision and admissions state machine.
3. `finance/payments`: invoices, capture, verification, reconciliation and gateway events.
4. `identity/student-activation`: account and credential issuance.
5. `learning/enrollment`: program enrollment and batch assignment.
6. `communications`: durable credential/payment notifications.
7. `admissions/orchestration`: one idempotent application service coordinating the approved handoff across those owners.

## Safe Consolidation Sequence

1. Characterize current phase 4 behavior with service-level tests and fixture builders.
2. Define application/payment/activation state-transition rules and idempotency keys.
3. Move default pipeline data to an explicit setup/seed command.
4. Route UI callers to the stronger phase 4 path without deleting legacy functions.
5. Compare production records and logs during a deprecation window.
6. Remove legacy entry points only after usage is proven absent.

No tiny code defect was changed in Phase 0. The overlap affects production-critical workflows and is not safe to repair without characterization tests and data review.
