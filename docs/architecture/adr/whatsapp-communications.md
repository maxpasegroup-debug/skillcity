# ADR-006: WhatsApp Communications

- Status: Proposed
- Date: 2026-09-27

## Context

The current provider logs the recipient, template and full message, returns `SENT`, and writes `WhatsAppMessageLog`. This is a development stub, not a production integration. Credential messages may contain temporary PINs.

## Decision

Retain a provider interface but replace the log-only behavior through a Communications-owned delivery service. Sending is asynchronous/durable where practical. Provider acceptance, delivery and read status are distinct. Inbound messages and delivery callbacks enter through authenticated webhook endpoints and are processed idempotently.

## Requirements

- Approved template registry, locale/version and parameter validation.
- Provider message ID, correlation/idempotency key and source workflow.
- Queued, submitted, sent, delivered, read and failed status history.
- Authenticated inbound/delivery callbacks with raw-event audit controls.
- Bounded retries, backoff and dead-letter/operator visibility.
- Consent/opt-out and business-window policy.
- Redaction: no PIN, OTP or token in application logs.
- Organization scope, actor and recipient audit data.

## Unresolved Decisions

- Provider and failover strategy.
- Queue/worker technology and delivery SLOs.
- Inbound conversation ownership and routing.
- Template approval/deployment workflow.
- Retention/redaction rules for message bodies.

## Consequences

The current stub remains documented technical debt. Until replacement, production must not treat `LOG_ONLY` status as evidence of delivery.
