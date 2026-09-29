# AIRA Skill City V2 SIA Operating Layer

## Purpose

Phase 4 adds one governed operating surface for SIA without creating another AI, identity, authorization, analytics, or workflow system. It reuses the Phase 10 AIRA AI Core, the technical `tara` assistant record, Phase 1 scope resolution, V2 role governance, authoritative business modules, Notifications, Internal Channels, and `PlatformAudit`.

## Operating Model

```text
Authorized human
  -> /sia
  -> scoped source-system counts and personal work signals
  -> optional governed conversational assistant
  -> SIA write proposal
  -> scoped accountable human decision
  -> no automatic business mutation
```

SIA is the user-facing virtual CEO identity. The existing `tara` assistant code remains the technical compatibility identifier so historical conversations, usage, policies, and audit records are preserved.

## Daily Brief

The briefing is generated live and is not an AI-authored copy of operational truth. Each area appears only when the actor has its underlying permission, and each count uses the existing scope builder for that same permission:

- People: active/probation/on-notice Employees.
- Admissions: submitted or under-review applications.
- Academic: active Batches.
- Finance: issued, partially paid, or overdue invoices.
- Technology: non-archived Labs products.
- Career: open Career Hub opportunities.
- Personal work: unread Notifications and active Internal Channel memberships.

The source module remains authoritative. SIA links users into that module to inspect and act.

## Approval Governance

CEO and Director retain their existing global business authority. The six V2 department heads receive `ai.approve` at `ORGANIZATION` scope. Proposal reads and review mutations independently enforce `canAccessResource` against the stored organization context.

Approval or rejection records the human decision and a `PlatformAudit`. It does not execute the proposed write. Autonomous execution, provider dispatch, and delegated privileged mutations remain prohibited.

## Security Decisions

- `/sia` requires `ai.use` server-side.
- Department cards require their domain permission and existing scoped query builder.
- Pending proposals are bounded and filtered in memory because organization context is JSON.
- Crafted proposal IDs are rechecked by the review action.
- Proposal reason and structured input are visible before a decision.
- The AI governance page now applies organization scope to proposal history.
- Internal Channels remain human-only; SIA is not a member and cannot publish.

## Data And Migration

No Prisma schema change is required. Migration `20260929000300_add_v2_sia_department_approvals` only upserts organization-scoped `ai.approve` grants for existing department-head roles. It does not create, delete, or rewrite business records.

`npm run audit:v2-sia` performs a read-only check of the assistant registry, department-head approval grants, and pending proposals whose organization context requires manual review.

## Deferred

- Autonomous execution of approved proposals.
- Email, WhatsApp, or Internal Channel sending by SIA.
- Scheduled or persisted briefing snapshots.
- New AI tools or unrestricted database access.
- Cross-department approval escalation workflows.
- Predictive management scores or invented metrics.
