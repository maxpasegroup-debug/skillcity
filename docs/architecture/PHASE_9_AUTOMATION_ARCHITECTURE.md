# Phase 9 Automation Architecture

## Event And Outbox Model

`DomainEvent` is a durable outbox record, not an authoritative business entity. It references an aggregate type and ID, carries a minimal payload, inherits organization scope, and has a unique idempotency key.

Phase 9 produces only:

- `lead.created` from the internal authorized CRM creation path;
- `career.application.submitted` from the Career Hub application transaction;
- `payment.confirmed` from authoritative finance verification.

Each event is inserted in the same database transaction as its business mutation. A retry therefore cannot create a second logical event for the same aggregate.

## Definitions

The existing `AutomationRule` model is extended rather than replaced. Legacy executive rules remain readable. New event rules add:

- stable code;
- exact event type;
- organization scope;
- creator;
- bounded attempts.

The Phase 9 management form can create only allowlisted event triggers with `SEND_NOTIFICATION`. Its action config accepts only:

- `recipientPayloadKey: recipientUserId`;
- a bounded title and message;
- an optional action URL.

No arbitrary JavaScript, expression evaluation, HTTP request, SQL, shell action, or provider credential is accepted.

## Execution And Idempotency

`AutomationExecution.idempotencyKey` is derived from event ID plus rule ID. `CommunicationMessage.idempotencyKey` is derived from that execution key. `Notification.communicationMessageId` is unique.

This chain gives exactly-once logical behavior under retries:

```text
business transaction
  -> unique DomainEvent
  -> unique AutomationExecution per rule
  -> unique CommunicationMessage
  -> unique Notification
```

Execution success and failure are durable. Errors are sanitized and retained. An event uses bounded exponential backoff and becomes `DEAD_LETTER` when attempts are exhausted.

## Scope

Rules and events have direct organization, division, district, branch/centre, and department references. The manual processor first selects events through Phase 1 scope predicates. Rules must match every scope component they explicitly constrain.

An organization-scoped operator cannot process or inspect another organization's event. Crafted IDs are not accepted by the management action.

## Job Boundary

`DomainEvent` is the persistent job/outbox record and `AutomationExecution` is the attempt/result history. Phase 9 does not use an in-process timer. The authorized "Process Pending Events" command safely processes a bounded batch and demonstrates the worker contract.

A production background worker or Railway cron invocation is still required for unattended processing. That deployment concern is intentionally not faked in the Next.js request process.

## Initial Automations

The additive migration creates one scoped in-app definition per existing organization for each first event. It does not create external email or WhatsApp rules and does not fabricate business records.

Future organizations can create definitions through the authorized UI or a future controlled provisioning process.

## Audit

`PlatformAudit` records template creation, automation creation, manual processing requests, and verified provider status changes. Event, execution, message, and notification rows provide operational history without duplicating business records.

## Deferred

- reliable unattended worker scheduling;
- schedule and manual trigger taxonomies;
- additional condition operators;
- task creation and external channel automation;
- dead-letter replay UI;
- AI-generated automations or actions.
