# AIRA Skill City V2 Role Data Normalization

## Purpose

The V2 role catalog is additive. Existing production assignments must not be silently replaced or broadened.

Run the read-only inventory before applying role seed changes:

```bash
npm run audit:v2-governance
```

The command prints role/user counts, missing V2 roles, missing expected permissions, and unexpected permissions. It does not write data or expose credentials.

## Safe Automatic

- Upsert missing V2 Role rows by stable key/name.
- Upsert missing Designation rows by stable key.
- Upsert missing Permission rows.
- Add expected RolePermission rows.
- Restore active/system metadata for catalog roles.

The seed intentionally does not delete existing RolePermission rows.

## Manual Review Required

- Every active user with `Admin`, `Director`, `CEO`, `COO`, or `HOD`.
- Existing Director permissions, especially `admin.access` and `user.manage`.
- Existing Admin users who should become Platform Administrator or CEO.
- Legacy HR Manager, HR Executive, Admission, Records Manager, Compliance Manager, Finance Manager, Communications Manager, and Automation Manager assignments.
- Duplicate or custom role names without stable keys.
- Users with multiple roles whose combined permissions exceed their actual duties.
- Users without an Employee record or effective organization assignment.
- Senior/Junior Academic Advisor Designation accuracy.
- Scope rows that are global without an approved global responsibility.

## Blocked

The live inventory is blocked in this workspace while `DATABASE_URL` is unavailable. No role changes, seed, or production normalization were executed.

## Reviewed Transition Examples

| Current data | Review | Target |
| --- | --- | --- |
| Director with platform permissions | Confirm business responsibility | Director without `admin.access`/`user.manage` |
| Admin performing only technical access work | Confirm no business authority | Platform Administrator |
| HR Manager | Confirm department ownership | People & Operations Head or HR & Operations Executive |
| Admission | Confirm leadership vs execution | Admissions & Growth Head or Admission Officer |
| Academic Advisor role plus free-text seniority | Verify title | Academic Advisor role plus Senior/Junior Designation |

Unknown business facts remain manual. Do not infer titles, reporting lines, scope, or leadership authority.
