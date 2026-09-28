# Phase 3 CRM Data Normalization

No production data was changed. No migration was created or executed. The current environment has no usable `DATABASE_URL`, so this document defines the read-only audit and review boundary for deployment preparation.

## Safe Automatic

These operations are deterministic after a database backup and read-only inventory:

- normalize future phone, WhatsApp, and email input at write time;
- report exact duplicate candidates by normalized phone, WhatsApp, or email within the same authorized scope;
- identify applications with more than one non-rejected record for the same lead/program;
- identify paid invoices whose lead/program pair differs from the application used for activation;
- identify active enrollments whose batch program differs from the enrollment program;
- identify scheduled follow-ups that are overdue;
- identify leads whose assignee has no active Employee record.

Automatic reporting does not mean automatic merging or reassignment.

## Manual Review

- duplicate people with different or shared contact identifiers;
- unscoped public or legacy leads that need institution/division/district/centre ownership;
- missing or uncertain interested programs;
- leads assigned to departed, inactive, or out-of-scope employees;
- applications duplicated across programs or created through historical paths;
- invoices without a reliable application/lead/program relationship;
- credentials shared by historical applications or student accounts;
- enrollments with missing batch where a batch is operationally required;
- source values that are free-form, obsolete, or semantically duplicated;
- whether historical direct invoice/payment records should remain visible or be archived.

Do not infer a campaign, program, owner, organization, student identity, or payment verification decision.

## Blocked

- record counts and issue counts;
- normalized duplicate inventory;
- relationship-integrity inventory;
- live query-plan/index verification;
- database-backed smoke tests;
- any data correction or merge.

These items require a confirmed safe database connection. Production must be inspected read-only unless mutation is separately authorized with reviewed records and rollback preparation.

## Suggested Read-only Inventory

When a safe connection is available, report:

1. Lead totals by scope, status, stage, source, and program.
2. Exact normalized phone/email duplicate groups without merging.
3. Leads missing scope, source, program, owner, or active employee assignment.
4. Applications grouped by lead/program and status.
5. Approved applications without a valid payment exemption or matching paid invoice.
6. Application/student/credential identity conflicts.
7. Enrollment/program/batch/journey conflicts.
8. Overdue scheduled follow-ups and orphan timeline records.

All resulting corrections require an explicit reviewed migration or administrative operation. No guessed values are permitted.
