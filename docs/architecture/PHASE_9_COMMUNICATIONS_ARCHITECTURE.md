# Phase 9 Communications Architecture

## Purpose

Phase 9 introduces one provider-neutral communications ledger for Email, WhatsApp, and in-app notifications. It does not replace CRM follow-up history and it does not claim that an external message was delivered without provider evidence.

## Existing Architecture Reused

- `server/email/provider.ts` remains the single Resend boundary. Missing development configuration returns `QUEUED`; provider acceptance returns `SUBMITTED`.
- `server/whatsapp/provider.ts` remains the single WhatsApp boundary. The current unconfigured adapter returns `QUEUED`, never `SENT`, and logs no recipient or message body.
- `Notification` remains the user-facing in-app inbox.
- `CommunicationLog` remains the CRM/admissions interaction and follow-up timeline. It is not a delivery ledger.
- `WhatsAppMessageLog` is retained for compatibility with the admission credential flow. New credential bodies are redacted at persistence time.
- `PlatformAudit` remains the audit mechanism.

## Central Model

`CommunicationMessage` is the authoritative delivery record for new centralized communication work. It records:

- channel and purpose;
- recipient user and optional provider address;
- masked recipient for operational views;
- immutable template-version reference;
- logical idempotency key;
- organization scope;
- provider and provider reference;
- queued, processing, submitted, sent, delivered, read, failed, or cancelled state;
- bounded attempts, availability, timestamps, and sanitized failure details;
- originating event and automation execution.

`SUBMITTED` means a provider accepted a request. `DELIVERED` and `READ` require a verified provider status or, for in-app notifications, successful durable persistence.

## Templates

`CommunicationTemplate` owns stable identity, channel, purpose, state, and organization scope. `CommunicationTemplateVersion` preserves subject/body, required variables, locale, and an optional non-secret provider template identifier.

Variables use the constrained `{{variableName}}` syntax. Rendering rejects missing variables and does not evaluate expressions or JavaScript. Historical messages reference the exact version used.

## Provider Boundary

`server/communications/delivery.ts` dispatches a queued central record through the existing Email or WhatsApp adapter. Business modules do not instantiate providers.

- Provider credentials remain environment configuration.
- `NotificationProvider.config` is legacy metadata and must not receive new secrets.
- SMS is not exposed by the Phase 9 template API.
- No external message is sent by the seeded automations.
- The current WhatsApp adapter is explicitly `UNCONFIGURED`.

## Webhooks

The provider-status service requires an HMAC signature over the raw request body before any database lookup or mutation. Status movement is monotonic and terminal failed/cancelled records cannot be silently reopened. A provider-specific public route is intentionally absent until its authentication contract and secret are configured.

## In-App Notifications

An in-app automation creates, in one transaction:

1. an idempotent `AutomationExecution`;
2. a delivered `CommunicationMessage`;
3. one `Notification` linked by a unique communication-message ID.

Users can view and mark only their own notifications at `/notifications`. Existing trainer notifications remain compatible and do not require a central message backfill.

## Consent And Preferences

`CommunicationPurpose` distinguishes transactional, operational, and marketing traffic. Marketing automation is not implemented. Channel preferences and consent enforcement are deferred; no automatic external communication should be enabled until those rules are defined.

## Security

- Delivery and template views use Phase 1 organization scope.
- Template creation validates the submitted organization hierarchy server-side.
- Management actions require centralized permissions.
- Provider secrets are absent from models, forms, client code, logs, and audit metadata.
- Admission PIN bodies are no longer written to new WhatsApp logs.
- Operational tables show masked recipients and do not expose message bodies.

## Operational UI

- `/communications`: scoped delivery log and event outbox.
- `/communications/templates`: scoped template registry and creation.
- `/communications/automations`: definitions, execution history, and authorized bounded processing.
- `/notifications`: the authenticated user's inbox.

## Deferred

- provider-specific webhook routes;
- consent and channel preferences;
- a durable Railway worker/scheduler;
- bulk campaigns, SMS, push, and marketing automation;
- migration of legacy CRM and WhatsApp history into the central ledger.
