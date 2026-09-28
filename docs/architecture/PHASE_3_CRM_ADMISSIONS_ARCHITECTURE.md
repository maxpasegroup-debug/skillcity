# Phase 3 CRM and Admissions Architecture

## Decision

AIRA Skill City uses one CRM and admissions lifecycle across divisions, centres, and programs. Phase 3 keeps the existing Prisma entities and Phase 1 authorization model. It does not introduce a second lead, applicant, student, program, batch, follow-up, payment, or audit system.

## Current Inventory

| Business concept | Authoritative implementation | Decision |
| --- | --- | --- |
| Prospect, enquiry, contact | `Lead` | Use one lead record; these are lifecycle terms, not new entities. |
| Source | `LeadSource` | Keep structured source references. |
| Campaign | No dedicated model | Deferred. Current operations do not capture a reliable campaign lifecycle. Source and referral remain authoritative. |
| Referral | `Referral` linked to `Lead` and `Program` | Keep. |
| Follow-up | Scheduled `CommunicationLog` plus `LeadActivity` | Keep and expose operationally. Do not create a duplicate follow-up table. |
| Calls and counselling | `LeadActivity` and `CounsellingSession` | Keep. |
| Application | `AdmissionApplication` | Keep as the only application model. |
| Admission | Approved application plus confirmed admission activity | Keep as a lifecycle decision; no speculative admission table. |
| Enrollment | `StudentEnrollment` | Keep as the authoritative student/program/journey/batch relationship. |
| Student | `User` with Student role and enrollment | Keep. There is no second Student identity. |
| Program and batch | `Program`, `Batch`, `Journey` | Keep and reference from CRM/admissions. |
| Employee owner | `Lead.assignedToId -> User -> Employee` | Keep; assignments are validated through Employee scope. |
| Timeline | `LeadActivity`, with `AuditLog` for security evidence | Keep. |
| Payment | `FeeInvoice`, `PaymentTransaction` | Keep behind the approved application workflow. Gateway work is deferred. |

## Lifecycle

The operating lifecycle is:

`Lead -> contact/qualification activity -> counselling -> AdmissionApplication -> approval/rejection -> verified payment boundary -> activation -> StudentEnrollment -> Batch`

`Lead.status` remains a coarse commercial state (`OPEN`, `WON`, `LOST`, `ARCHIVED`). Detailed progress remains in configurable `PipelineStage` and authoritative related records. Phase 3 does not add a competing status enum.

## Lead and Ownership

`Lead` stores direct organization scope because it may exist before a program or application. Interested program, structured source, owner, assignee, priority, and contact identifiers remain on the existing model.

Lead creation now:

- normalizes phone, WhatsApp, and email;
- checks duplicate identifiers within the actor's effective scope;
- reports a possible duplicate without merging data;
- validates optional program access;
- validates optional assignee as an active, in-scope Employee;
- commits the lead, timeline event, and audit record atomically.

Assignment uses `User` only as the relation target required by the existing schema. Server policy resolves that User to one active Employee and applies Phase 1 employee scope before writing.

## Follow-up and Timeline

An internal scheduled `CommunicationLog` is an operational follow-up. Its employee is `userId`, due date is `scheduledAt`, and note/next action are `subject` and `message`. A corresponding `FOLLOW_UP_SCHEDULED` activity appears in the lead timeline. Calls, counselling, application changes, payment events, and activation continue to append `LeadActivity` records.

## Application, Admission, and Enrollment

These concepts remain separate:

- `AdmissionApplication` is a candidate's application to one Program.
- Approval or rejection is the admission decision.
- `StudentEnrollment` is the authoritative active academic relationship.

Application creation permits only `DRAFT` or `SUBMITTED`; review actions control later states. An active lead/program application is idempotent, and explicit lead/program organization conflicts are rejected.

The Phase 4 application operating page is the authoritative payment and activation path. Legacy direct invoice, direct payment-status, credential-only, and paid-lead conversion actions are disabled and their unused UI entry points are removed.

Activation now verifies:

- application management permission and application scope;
- optional invoice scope and exact lead/program ownership;
- verified payment for paid programs;
- optional batch scope, active state, program, journey, and capacity;
- existing application/student identity consistency;
- WhatsApp credential ownership;
- idempotent enrollment through the existing unique student/program/journey key.

## Organization Scope

- Lead: direct institution, division, district, and campus scope.
- Application: inherited from Lead, with Program fallback only for legacy unscoped leads.
- Follow-up/activity/counselling: inherited from Lead.
- Program: direct organization, division, campus, and department scope.
- Batch: inherited from Program with optional campus refinement.
- Enrollment: inherited from Batch when assigned, otherwise Program.
- Invoice/payment: inherited through Lead, Batch, Program, or Enrollment according to the Phase 1 predicate.

List, detail, aggregate, assignment, application, payment, activation, and enrollment paths use these server-side predicates. UI visibility is not an authorization control.

## Funnel

The reusable scoped funnel counts:

- leads from `Lead`;
- contacted and qualified from qualifying `LeadActivity` records;
- counselled from leads with `CounsellingSession`;
- applied and admitted from `AdmissionApplication` relationships;
- enrolled from active `StudentEnrollment` records;
- due follow-ups from scheduled internal `CommunicationLog` records.

Enrollment conversion is calculated from enrollment records, not `Lead.status`. Dashboard program-specific hard-coding was removed.

## Payment Boundary

Phase 3 does not implement gateways, webhooks, reconciliation, or finance redesign. A payment is captured as pending verification, verification updates transaction and invoice state, and only an exact paid invoice for the same lead/program can satisfy activation. Free programs remain explicitly exempt.

## Audit Strategy

Lead creation, assignment, follow-up creation, application creation, payment verification, admission activation, and enrollment/batch operations reuse `AuditLog`, `LeadActivity`, and `EnrollmentLog`. No new audit framework was created.

## Deferred Decisions

- Add Campaign only when campaign identity, ownership, dates, and source ingestion are real business inputs.
- Add explicit follow-up outcomes only when operational reporting requires more than communication status and timeline activity.
- Payment gateway and reconciliation work remains a later finance/payment phase.
- Database-backed data normalization remains blocked until a safe `DATABASE_URL` is available.
