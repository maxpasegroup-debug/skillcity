# Phase 11 Analytics Data Normalization

## Principle

Analytics exposes data quality; it does not invent missing facts. No operational records are changed by Phase 11.

## Safe Automatic

- Convert configured business-time-zone boundaries to UTC query instants.
- Treat absent aggregate rows as zero counts.
- Group invoice and payment amounts by their stored currency.
- Omit percentage calculations when the denominator is zero.
- Omit trend percentages when the previous comparable value is zero.
- Hide aggregate attention rows whose authoritative count is zero.

These transformations are deterministic and do not alter source data.

## Manual Review Required

- Fee invoices with a null or invalid currency. Amounts remain labelled `normalization-required` and are not included in a finance headline.
- Historic invoices whose currency does not match the associated payment-provider settlement currency.
- Programs without an `operatingDomain`; they remain `UNCLASSIFIED` and are not guessed into Startup School or Skill Studio.
- Employees without valid status, designation, or effective organization assignments. Phase 2 normalization remains authoritative.
- Labs products without current owner assignments. Phase 5 normalization remains authoritative.
- Career records with incomplete employer, profile, or opportunity relationships. Phase 7 normalization remains authoritative.
- Compliance records without reliable expiry dates; they cannot participate in expiry attention counts.
- Communications or automations that predate status/audit coverage and therefore cannot support historical delivery or failure rates.
- AI usage records without provider-reported token values. Tokens remain null; they are never estimated.

## Blocked

- Live inventory counts and quality classification while `DATABASE_URL` is unavailable.
- Database-backed metric reconciliation against production records.
- Historical trend validation before all required migrations are deployed.
- Currency conversion without an approved exchange-rate source, accounting policy, and effective-date rule.
- Retention, completion, health, performance, revenue-recognition, and conversion benchmarks without approved business definitions.

## Removed Misleading Interpretations

- Fixed retention percentages are not analytics.
- Presence of system settings is not system health.
- Assignment or win counts are not employee performance scores.
- Amounts in different currencies are not one revenue total.

No automatic data normalization or production migration was executed.

