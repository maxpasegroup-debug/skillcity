# ADR-004: Payments

- Status: Proposed
- Date: 2026-09-27

## Context

`FeeInvoice` and `PaymentTransaction` support provider-neutral and manual records. Admissions actions create, capture and verify payments, but there is no gateway SDK, webhook endpoint, reconciliation job, ledger or durable idempotency strategy. Multiple action paths enforce different rules.

## Decision

Create a Finance-owned payment service with a gateway adapter interface. Manual payments remain a first-class adapter and use the same state machine as external gateways. Provider callbacks/webhooks are authoritative inputs that are authenticated, stored, idempotently processed and auditable.

Admissions consumes verified-payment outcomes; it does not directly mark gateway payments successful. Existing tables remain until a reviewed additive migration is designed.

## Requirements

- Provider payment/order IDs and idempotency keys.
- Signed webhook verification and replay protection.
- Raw callback retention with sensitive-field controls.
- Explicit initiated, pending, successful, failed, refunded and disputed transitions.
- Invoice allocation for partial and multiple payments.
- Reconciliation against provider settlement data.
- Immutable audit trail and actor/source metadata.
- Retryable processing with dead-letter visibility.

## Unresolved Decisions

- Initial gateway(s), settlement model and fee handling.
- Ledger/accounting depth and GST/receipt requirements.
- Refund/chargeback approval workflow.
- Commission trigger timing.
- Migration of historical manual records.

## Consequences

Gateway implementation is intentionally deferred. Admissions consolidation must not further embed payment state transitions in UI actions.
