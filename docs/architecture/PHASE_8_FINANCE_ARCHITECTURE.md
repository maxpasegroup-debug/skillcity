# Phase 8 Finance Architecture

## Decision

Existing `FeeInvoice` and `PaymentTransaction` remain the authoritative operational invoice/payment records. Phase 8 extends and centralizes them rather than creating competing `Invoice` or `Payment` tables. Admissions continues to consume verified payment state through its existing authoritative activation workflow.

## Invoice

`FeeInvoice` now supports direct nullable organization scope for new central records, ISO-style currency code, reference, issue/cancellation dates, and creating actor. Existing lead, student, program, batch, scholarship, discount, tax, transaction, and commission relations are preserved.

Central invoice creation is deliberately program-backed. The server authorizes the Program and derives organization scope from it; browser-supplied organization IDs are not accepted. Amounts are integer minor units. Tax is explicit input and no GST/tax rate is guessed. New invoices begin as `DRAFT`.

Statuses support `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID`, and `CANCELLED`. Paid states are derived from verified payments and cannot be asserted through the invoice status form.

## Payment

`PaymentTransaction` remains provider-neutral. Phase 8 adds recorder, verifier, and verification time. A recorded payment begins `INITIATED`, requires a provider reference, cannot exceed the authoritative invoice balance, and is not proof of payment. A separate authorized verification decision sets `SUCCESS` or `FAILED` and recalculates invoice state inside a serializable transaction.

No gateway SDK, webhook, settlement, reconciliation, or refund workflow was added. Existing Razorpay/Stripe enum values are capability labels, not claims of active integrations.

## Scope and Permissions

Finance uses `finance.read`, `finance.invoice.manage`, and `finance.payment.manage`. Finance Manager receives organization scope. Admin, Director, CEO, and COO receive global scope. Payments inherit scope through their invoice. Legacy invoices without direct scope continue to use lead, batch, program, and enrollment fallback predicates.

## Wallet and Commission Separation

`Wallet`/`WalletTransaction` remain Skill Coins and XP reward records. `CommissionRecord` remains the BDM commission domain. Neither is a financial ledger, receivable, settlement, or payment allocation. Phase 8 does not merge, settle, recalculate, or migrate them.

## Audit and Reporting

Invoice creation/status changes and payment capture/verification write `PlatformAudit`. The UI presents scoped operational records only. It does not combine currencies into revenue, fabricate refunds, or claim accounting totals.

## Deferred

- Payment gateway adapters, signed webhooks, idempotency, and reconciliation
- Refunds, chargebacks, receipts, and settlement
- General ledger, double-entry accounting, expenses, tax filing, payroll
- Historical invoice scope normalization
- Cross-domain billing beyond verified program-backed creation
