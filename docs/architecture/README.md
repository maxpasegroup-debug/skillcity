# AIRA Skill City Architecture

This directory is the entry point for architecture and engineering guardrails. The current strategy is **modify, not full rebuild**: retain proven workflows and introduce stronger boundaries incrementally.

## Phase 0

- [Repository baseline](./PHASE_0_BASELINE.md)
- [Phase 0 completion report](./PHASE_0_COMPLETION_REPORT.md)
- [Deferred issues](./PHASE_0_DEFERRED_ISSUES.md)
- [Domain ownership](./AIRA_DOMAIN_OWNERSHIP.md)
- [Admissions consolidation plan](./ADMISSIONS_CONSOLIDATION_PLAN.md)
- [Runtime bootstrap audit](./RUNTIME_BOOTSTRAP_AUDIT.md)

## Phase 1

- [Phase 1A organization architecture](./PHASE_1A_ORGANIZATION_ARCHITECTURE.md)
- [Phase 1A data migration](./PHASE_1A_DATA_MIGRATION.md)
- [Phase 1A completion report](./PHASE_1A_COMPLETION_REPORT.md)
- [Authorization and organization scope](./PHASE_1_AUTHORIZATION_AND_SCOPE.md)
- [Production migration plan](./PHASE_1_PRODUCTION_MIGRATION_PLAN.md)
- [Phase 1 completion report](../../AIRA_SKILL_CITY_PHASE_1_REPORT.md)

## Architecture Decisions

- [ADR-001: Identity and authentication](./adr/identity-and-authentication.md)
- [ADR-002: Authorization and permissions](./adr/authorization-and-permissions.md)
- [ADR-003: Organization and tenancy](./adr/organization-and-tenancy.md)
- [ADR-004: Payments](./adr/payments.md)
- [ADR-005: Storage and documents](./adr/storage-and-documents.md)
- [ADR-006: WhatsApp communications](./adr/whatsapp-communications.md)

## Source Audits

The repository-root audit files remain the source for full current-state evidence:

- `AIRA_SKILL_CITY_CURRENT_STATE_AUDIT.md`
- `AIRA_SKILL_CITY_ARCHITECTURE_MAP.md`
- `AIRA_SKILL_CITY_GAP_ANALYSIS.md`
- `AIRA_SKILL_CITY_IMPLEMENTATION_ROADMAP.md`

Future architecture documents should be added here and linked from this index. ADRs record durable decisions; audit files record observed state; implementation plans record sequencing.
