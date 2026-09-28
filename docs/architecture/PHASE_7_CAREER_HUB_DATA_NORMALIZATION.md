# Phase 7: Career Hub Data Normalization

## Safety Rule

Phase 7 does not infer employers, opportunities, talent profiles, applications, referrals, engagements, or outcomes from adjacent historical data. Similar names do not make records semantically equivalent.

After the additive migration is applied to a confirmed environment, run:

```bash
npm run audit:career-hub
```

The audit is read-only and reports Career Hub records beside adjacent record counts.

## Existing Records and Authority

| Existing record | Authority | Normalization decision |
| --- | --- | --- |
| `CareerApplication` | Internal AIRA HR recruitment | Keep untouched; never migrate automatically to Nice Jobs. |
| `CareerInterview`, recruitment activities | Internal HR workflow | Keep untouched. |
| `PlacementProfile` | Student readiness | Reuse as evidence only; no automatic CareerTalentProfile creation. |
| `PlacementApplication` | Self-reported placement tracking | Keep untouched; not an authoritative OpportunityApplication. |
| `StudentPortfolio`, approved projects, verified skills | Learner evidence | Read through User ID; do not copy. |
| `ResumeProfile` | Participant resume evidence | Read through User ID; do not copy or expose automatically. |
| `Internship`, `CareerMilestone` | Student success evidence | Keep untouched; no fabricated outcome. |
| `Referral` | Admissions lead/program attribution | Keep separate from CareerReferral. |
| `CommissionRecord` | Admissions/BDM finance record | Keep untouched. |
| `Wallet`, `WalletTransaction` | Existing rewards implementation | Do not use as Nice Jobs money/coins settlement. |
| `Institution` | AIRA internal organization | Use for operational scope only, not external employer identity. |

## Safe Automatic

- Create empty Career Hub tables, enums, indexes, permissions, and system roles.
- Keep every historical record unchanged.
- Default new talent visibility to Application Only.
- Default new employer status to Pending.
- Default new opportunity status/visibility to Draft/Internal.
- Preserve duplicate prevention through database unique constraints.

## Manual Review Required

- Approve each external employer and private contact source.
- Verify employer status and evidence before opening listings.
- Confirm each opportunity owner Employee and organization scope.
- Decide whether any historical placement record corresponds to a real opportunity/application.
- Ask each participant to create or consent to a CareerTalentProfile; do not auto-publish learner data.
- Verify any referral attribution before future reward policy is considered.
- Confirm post-selection engagement and outcome facts before adding future records.
- Review external talent role assignment separately from Student registration.

## Blocked

- Inventory counts are blocked until `DATABASE_URL` is available and migration is applied.
- Production migration requires explicit deployment approval.
- Historical matching is blocked without verified business ownership and participant consent.
- Financial normalization is blocked pending a dedicated ledger/finance architecture.

## Prohibited Automatic Migrations

- Internal `CareerApplication` to OpportunityApplication.
- PlacementApplication to OpportunityApplication.
- Institution or free-text company names to verified CareerEmployer.
- Admissions Referral to CareerReferral.
- Wallet or Commission records to NICE Coins/payouts.
- StudentPortfolio visibility to CareerTalentProfile visibility.
- Internship/Milestone to verified career outcome.

