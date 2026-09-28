# Phase 5 Labs Data Normalization

## Principle

No existing record is automatically promoted to a Labs product. Product identity, owner, organization, lifecycle, and type are business facts that must be verified.

Run `npm run audit:labs` only after the migration is available in a safely identified database. The command is read-only.

## Existing Product-Like Data

### Preserve Unchanged

- `Program` records and public AIRA Labs program content represent admissions/learning offerings.
- `PortfolioProject` records represent student career evidence.
- project Activities and Submissions represent academic work.
- marketplace project listings represent community assets.
- AI/provider and automation settings represent runtime infrastructure.
- career applications represent recruitment.

These records have different ownership and lifecycle semantics and are not duplicate product registry rows.

### Authoritative After Migration

- `LabsProduct`: product identity, classification, lifecycle, and organization.
- `LabsProductAssignment`: primary owner and contributor history.
- `PlatformAudit`: mutation audit trail.

## Safe Automatic

- Create the additive Labs tables, enums, indexes, constraints, permissions, and standard grants.
- Normalize product codes to lowercase at authorized creation time.
- Mark replaced owner assignments inactive while retaining the records.

No named Labs product is safe to create automatically.

## Manual Review Required

- Verify whether each candidate application/platform is owned by AIRA Labs.
- Confirm canonical name and immutable product code.
- Confirm Product Type and current Lifecycle without inferring deployment status.
- Confirm Institution, Division, and any narrower organizational scope.
- Confirm active primary owner Employee and additional contributors.
- Resolve products with no effective owner or multiple effective owners.
- Resolve assignments to inactive employees or incompatible organization placements.
- Decide whether any future development project should reference a product; do not convert student projects.

## Blocked

`DATABASE_URL` is unavailable in the current environment. Live counts, migration rehearsal, and database-backed smoke checks are therefore blocked. No production records were inspected or changed.

## Read-Only Audit Output

`npm run audit:labs` reports:

- total registered Labs products;
- products without an effective owner;
- products with multiple effective owners;
- incompatible effective Employee assignments;
- assignments with inactive Employee/User state;
- adjacent AIRA Labs Program, PortfolioProject, and marketplace Project counts, explicitly marked as not migrated.

## Deployment Sequence

1. Confirm the target database and pending migration order through Phase 4A.
2. Review `20260928000200_add_aira_labs_foundation/migration.sql`.
3. Apply through the normal Prisma deployment command.
4. Run `npm run audit:labs` read-only.
5. Resolve manual-review items.
6. Register verified products through `/labs`; do not seed guessed records.
7. Perform scoped read/create/update/assignment smoke checks using safe test data.
