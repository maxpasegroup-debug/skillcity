# AIRA Skill City Phase 9 Report

## Executive Summary

Phase 9 establishes the central Communications and Automation foundation without building a general workflow engine. It adds a durable organization-scoped event outbox, provider-neutral delivery records, versioned templates, constrained event automations, bounded retries, execution history, verified status-update primitives, and an in-app notification inbox.

The implementation reuses the central identity, permissions, organization scope, audit, Resend, WhatsApp, notification, and executive automation foundations. It preserves CRM communication history and legacy WhatsApp records rather than misclassifying them as provider delivery evidence.

## Existing Communication Architecture Audited

- Resend was already the single email provider in `server/email/provider.ts`.
- WhatsApp used one log-only adapter, but it logged full content and incorrectly returned `SENT`.
- `CommunicationLog` represented CRM interactions/follow-ups, not provider delivery.
- `WhatsAppMessageLog` supported admission credential history.
- `Notification` already provided in-app unread/read state.
- No verified provider webhook path or central delivery ledger existed.

The unsafe WhatsApp behavior is corrected: the unconfigured adapter returns `QUEUED`, logs no payload, and new admission PIN log bodies are redacted.

## Existing Automation Architecture Audited

`AutomationRule` and `AutomationExecution` existed in Executive OS with business-specific trigger enums and free-form JSON, but no event outbox, organization scope, idempotency, worker, retry schedule, or runtime executor. No durable queue/cron infrastructure was found.

These models were extended and retained. The legacy creation page now redirects to the constrained Phase 9 operations view.

## Event And Outbox Architecture

`DomainEvent` contains event type, organization scope, actor, aggregate reference, minimal payload, unique idempotency key, status, attempts, availability, processing time, and sanitized error information.

Events are emitted atomically from:

- internal authorized lead creation;
- Career Hub application submission;
- authoritative payment verification.

Business records remain authoritative. No automation-specific Lead, Application, or Payment model was created.

## Email Architecture

The existing Resend adapter is reused. Development without a key reports `QUEUED / UNCONFIGURED`; provider acceptance reports `SUBMITTED`. Business modules do not receive provider credentials or instantiate Resend.

No automated external email rule is enabled in Phase 9.

## WhatsApp Architecture

The existing provider/service boundary is retained and hardened. The log-only implementation no longer claims successful sending and no longer writes sensitive details to console output. The compatibility log is persisted before provider invocation, and new admission credential bodies are redacted.

No real WhatsApp provider, webhook route, or automatic external rule is claimed.

## In-App Notification Architecture

The existing `Notification` model is extended with an optional unique central-message link. Event automation creates the execution, delivered in-app message, and notification idempotently. `/notifications` lists only the authenticated user's records and ownership is enforced during read-state mutation.

## Template Architecture

`CommunicationTemplate` supplies stable organization-scoped identity, channel, purpose, and lifecycle. `CommunicationTemplateVersion` preserves historical body/subject, required variables, locale, and a non-secret provider template ID.

The renderer supports only named placeholders and rejects missing variables. It cannot execute code.

## Automation Architecture

New definitions use `EVENT` triggers with allowlisted event types and `SEND_NOTIFICATION`. Configuration is strictly parsed: recipient comes only from `recipientUserId`, content is bounded, and an optional internal URL may be supplied. Arbitrary code, HTTP actions, dynamic expressions, and SQL are impossible through this path.

## Job, Retry, And Idempotency

The outbox is the persistent job boundary. Processing is bounded, event/execution/message/notification keys are unique, failures are durable, retry delay is bounded exponential backoff, and exhausted events become dead-letter records.

An authorized manual processor demonstrates the worker contract. No in-process timer or fake asynchronous scheduler was introduced. Unattended execution requires future Railway worker/cron configuration.

## Webhooks

The provider-update service verifies an HMAC signature over the raw body before lookup or mutation, applies monotonic status transitions, handles duplicate status callbacks idempotently, and audits accepted changes. A public provider route is deferred until a real provider authentication contract exists.

## Permission Model

Added:

- `communications.read`
- `communications.manage`
- `communications.send`
- `communication-templates.manage`
- `automations.read`
- `automations.manage`

Added scoped `Communications Manager` and `Automation Manager` roles. Admin, Director, CEO, and COO receive global grants. All management mutations enforce permissions server-side.

## Organization Scope

Events, messages, templates, and automation rules support organization, division, district, branch/centre, and department scope. Queries reuse Phase 1 scope resolution. Submitted organization references are validated server-side, and processing selects only events accessible to the operator.

## Security

- No provider secrets are stored in the new database models, source, client code, logs, or audit metadata.
- No unverified webhook mutation is possible through the provider-update service.
- No arbitrary code or HTTP execution exists.
- External delivery is never inferred from provider acceptance.
- Recipient values are masked in operational views.
- New admission PIN bodies are redacted from WhatsApp logs.
- Marketing sends and preference bypass are not implemented.

## Audit

`PlatformAudit` records template creation, automation creation, processing requests, and verified provider status changes. Domain events, executions, and communication records retain operational history.

## UI

- `/communications` for scoped deliveries and outbox state.
- `/communications/templates` for authorized template creation and registry.
- `/communications/automations` for controlled definitions, processing, and execution history.
- `/notifications` for each user's own inbox.

No visual workflow editor or application-wide redesign was introduced.

## New Models And Schema Changes

Added:

- `DomainEvent`
- `CommunicationTemplate`
- `CommunicationTemplateVersion`
- `CommunicationMessage`
- four controlled enums for event/delivery/template state and purpose.

Extended:

- `AutomationRule`
- `AutomationExecution`
- `Notification`
- organization and user relations.

## Migration Safety

Migration: `prisma/migrations/20260928000600_add_communications_automation_foundation/migration.sql`

The migration is additive. Static inspection found no table/column drops, truncation, deletion, renaming, or destructive data rewrite. Existing users, notifications, CRM communication logs, WhatsApp logs, automation rules, and executions are preserved. It seeds only controlled organization-scoped definitions and centralized permissions/roles.

Production migration was not executed.

## Tests

Phase 9 adds coverage for event allowlists, outbox idempotency, template variables, recipient masking, webhook verification, status monotonicity, organization scope, permission isolation, constrained definitions, successful/failed execution, dead-letter behavior, duplicate protection, provider submission semantics, audit, and WhatsApp durable logging/redaction.

The complete suite passes **220/220 tests across 33 files**, including all 198 baseline tests.

## Validation

- Vitest: **220/220 passed across 33 files**
- ESLint: **passed with zero warnings**
- TypeScript (`npx tsc --noEmit`): **passed**
- Prisma Client generation: **passed** with Prisma 6.19.3
- Prisma validation: **blocked only because `DATABASE_URL` is unavailable** (`P1012`)
- Next.js production build: **passed**, including 50/50 static pages and the new dynamic routes
- Browser smoke testing: **not performed; the in-app browser was unavailable**
- Safe unauthenticated HTTP smoke check: **passed** (`/` returned 200; `/communications` and `/notifications` returned 307 to `/login`)
- Database-backed normalization audit/smoke testing: **not performed; `DATABASE_URL` is unavailable**
- Production migration: **not executed**

## Known Limitations

- `DATABASE_URL` availability determines database validation and read-only normalization audit.
- No production migration has been run.
- No real WhatsApp provider is configured or tested.
- No provider-specific webhook endpoint is exposed.
- Resend delivery webhooks are not connected.
- Background processing requires an explicitly deployed Railway worker/cron invocation.
- Consent and channel-preference policy is deferred, so automatic external marketing remains disabled.
- Existing sensitive legacy WhatsApp rows require read-only inventory and manual review after migration.

## Deferred Work

Provider onboarding, channel preferences, consent, unattended workers, dead-letter replay UI, additional controlled events/actions, SMS/push, campaigns, and AI automation are future work. Phase 10 was not started.

## Status

PHASE 9 STATUS: COMPLETE
