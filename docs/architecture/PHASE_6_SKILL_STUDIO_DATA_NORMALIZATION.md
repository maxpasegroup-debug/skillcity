# Phase 6: Skill Studio Data Normalization

## Rule

Historical academic data is not classified by guessing from names, categories, or URLs. The Phase 6 migration adds nullable metadata and preserves every existing Program, Batch, Journey, Enrollment, trainer relationship, and progress record unchanged.

Run the read-only inventory after the migration is applied to a confirmed environment:

```bash
npm run audit:skill-studio
```

The command reports counts only and performs no writes.

## Safe Automatic

- Create missing permission definitions and standard role grants through migration SQL.
- Keep new classification columns null for historical programs.
- Inherit Program delivery mode when a Batch override is null.
- Preserve legacy ALTT presentation for unclassified historical programs.
- Create a generic version-one Journey when a new Skill Studio Program is created through the authorized action.

No historical Program should be automatically changed to `SKILL_STUDIO`.

## Manual Review Required

- Decide which existing Programs belong to Skill Studio, Startup School, or General operations.
- Verify each Skill Studio program type.
- Verify online, offline, or hybrid delivery mode.
- Decide whether each program uses Standard learning or ALTT.
- Confirm the owning Institution and Division.
- Confirm Centre and Department where applicable.
- Review programs without a Journey/curriculum.
- Review batches without an active trainer assignment.
- Review active enrollments without a Batch.
- Verify that historical trainer Employees have compatible effective organization assignments.
- Review candidate programs identified by name/category matching; the audit deliberately does not migrate them.

## Blocked

- Record counts and issue totals are blocked until `DATABASE_URL` is available and the Phase 6 migration has been applied to a confirmed safe environment.
- Production migration execution is blocked pending explicit deployment approval.
- Classification is blocked wherever the business owner has not confirmed program domain, type, delivery mode, learning model, or organization ownership.

## Recommended Sequence

1. Back up and confirm the target database environment.
2. Review the additive migration SQL.
3. Apply migrations using the normal Prisma deployment workflow.
4. Run `npm run audit:skill-studio` read-only.
5. Export the identified records for business review.
6. Apply only approved classifications through an audited administrative workflow or reviewed migration.
7. Re-run the audit and perform browser/database smoke tests.

