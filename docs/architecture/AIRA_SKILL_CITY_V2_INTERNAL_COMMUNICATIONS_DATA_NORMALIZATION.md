# AIRA Skill City V2 Internal Communications Data Normalization

## Existing Data

Phase 9 `CommunicationMessage`, `Notification`, `CommunicationLog`, WhatsApp logs, templates, domain events, and automation executions retain their existing meanings. They must not be migrated into internal channels automatically.

No historical team-channel data currently has an authoritative source in the repository.

## Safe Automatic

- Apply the additive internal-channel migration.
- Seed the three centralized permissions and expected V2 RolePermission rows.
- Create new channels only through the authorized UI after deployment.
- Generate Notifications for new channel messages.

## Manual Review Required

- Decide the initial organization-wide authority announcement channel.
- Confirm the CEO/Director/department-head Owners and Moderators.
- Confirm district and hub channel membership from effective Employee assignments.
- Review employees with legacy roles before granting channel permissions.
- Review inactive accounts and employees without valid Employee links.
- Confirm that no existing academic or CRM announcement history should become a team channel.

Do not invent membership from email domains, job-title text, old chat groups, or geographic assumptions.

## Read-only Audit

After migration, run:

```bash
npm run audit:v2-communications
```

It reports counts and flags channels without exactly one active Owner, active members without Employee records, and unavailable accounts. It does not mutate data.

## Blocked

Database inventory, migration rehearsal, and database-backed channel smoke tests are blocked while `DATABASE_URL` is unavailable. The production migration was not executed.
