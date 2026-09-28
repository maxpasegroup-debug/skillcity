# Phase 4A Academic Advisor Data Normalization

## Purpose

Phase 4A does not infer advisor ownership from recruitment applications, designation text, trainer relationships, counselling records, or existing student activity. The read-only command `npm run audit:academic-advisors` inventories advisor readiness after the migration is available in a safely identified database.

## Audit Inventory

The audit reports:

- employees with the Academic Advisor designation;
- users with the Academic Advisor role;
- designation/role mismatches;
- role holders without Employee profiles;
- effective direct and batch assignments;
- students with multiple effective direct assignments;
- active enrollments without advisor coverage;
- invalid assignment targets;
- advisor/target organization mismatches;
- assignments whose advisor account is inactive.

## Safe Automatic

- Create the additive assignment table, constraints, indexes, centralized permissions, and system role through the reviewed migration.
- Add missing standard permission grants for Admin, Director, and Academic Advisor through the same migration.
- End an assignment through the application when its verified end date is known; this preserves history.

No student-to-advisor assignment is safe to infer automatically from designation, batch, geography, counselling activity, or recruitment data.

## Manual Review Required

- Confirm each advisor Employee has the correct active User, Employee status, role, designation, and organizational assignment.
- Decide whether each active Student should receive direct ownership or inherit coverage from a Batch.
- Resolve every student with more than one effective direct advisor before deployment.
- Review designation holders without the Academic Advisor role and role holders without the designation; role controls capability while designation remains job metadata.
- Resolve active enrollments without advisor coverage according to current academic operations.
- Confirm organization mismatches rather than moving an Employee or Student automatically.
- Review inactive advisor accounts with effective assignments and reassign or end those records.

## Blocked

The current environment has no usable `DATABASE_URL`, so no live counts, relationship inventory, or database-backed normalization audit was performed. No values were invented and no production data was changed.

## Deployment Order

1. Confirm the target database and backup policy.
2. Confirm pending Phase 1A and Phase 2 migrations are applied in order.
3. Review and deploy `20260928000100_add_academic_advisor_assignments`.
4. Run `npm run audit:academic-advisors` read-only.
5. Resolve manual-review items with verified business owners.
6. Run controlled read-only and authorized smoke checks.
