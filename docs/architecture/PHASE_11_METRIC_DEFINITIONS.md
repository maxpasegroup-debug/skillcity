# Phase 11 Metric Definitions

All metrics are filtered by `executive.access` and the actor's effective organization scope. `Current period` means `[period start, request time)` in the configured analytics time zone. State metrics are current unless a period is explicitly named.

| Metric | Definition | Authoritative source | Time field |
| --- | --- | --- | --- |
| `admissions.leads` | Leads created in current period | `Lead` | `createdAt` |
| `admissions.applications` | Applications created in current period | `AdmissionApplication` | `createdAt` |
| `admissions.counselling` | Sessions scheduled in current period | `CounsellingSession` | `scheduledAt` |
| `admissions.enrollments` | Enrollments started in current period | `StudentEnrollment` | `startedAt` |
| `admissions.period_application_ratio` | Applications / leads x 100; null when leads are zero | Counts above | Current period |
| `learning.active_programs` | Active, non-deleted programs grouped by operating domain | `Program` | Current state |
| `learning.active_batches` | Active batches in Startup School or Skill Studio | `Batch` | Current state |
| `learning.active_enrollments` | Enrollments with status `ACTIVE` | `StudentEnrollment` | Current state |
| `learning.trainer_assignments` | Active trainer assignments in the two learning domains | `TrainerAssignment` | Current state |
| `learning.advisor_assignments` | Active, effective advisor assignments | `AcademicAdvisorAssignment` | Effective at request time |
| `labs.total_products` | All visible products grouped by lifecycle | `LabsProduct` | Current state |
| `labs.active_products` | Products in `BUILDING`, `PILOT`, `LIVE`, or `MAINTENANCE` | `LabsProduct` | Current state |
| `labs.owners` | Active, effective owner assignments | `LabsProductAssignment` | Effective at request time |
| `career.open_opportunities` | Open, non-archived opportunities | `CareerOpportunity` | Current state |
| `career.applications` | Opportunity applications submitted in current period | `CareerOpportunityApplication` | `submittedAt` |
| `people.active_employees` | Employees in `ACTIVE`, `PROBATION`, `ON_LEAVE`, or `ON_NOTICE` | `Employee` | Current state |
| `people.organization_assignments` | Effective employee organization assignments | `EmployeeOrganizationAssignment` | Effective at request time |
| `finance.invoiced` | Invoice totals for invoices created in current period, per currency | `FeeInvoice` | `createdAt` |
| `finance.outstanding` | Total of current-period invoices in issued, partially paid, or overdue states, per currency | `FeeInvoice` | `createdAt` + current status |
| `finance.paid` | Successful payment amounts paid in current period, per invoice currency | `PaymentTransaction` | `paidAt` |
| `compliance.expiring` | Non-archived records expiring after now and within 30 days | `ComplianceRecord` | `expiresAt` |
| `compliance.expired` | Non-archived records whose expiry is at or before now | `ComplianceRecord` | `expiresAt` |
| `operations.communication_delivered` | Current-period messages in `DELIVERED` or `READ` | `CommunicationMessage` | `createdAt` |
| `operations.communication_failed` | Current-period messages in `FAILED` | `CommunicationMessage` | `createdAt` |
| `operations.automation_failed` | Current-period executions in `FAILED` | `AutomationExecution` | `executedAt` |
| `operations.failed_events` | Current-period domain events in `FAILED` or `DEAD_LETTER` | `DomainEvent` | `createdAt` |
| `ai.requests` | Usage-log rows created in current period | `AIUsageLog` | `createdAt` |
| `ai.measured_tokens` | Provider-reported input plus output tokens; missing values remain unmeasured | `AIUsageLog` | `createdAt` |
| `ai.tool_executions` | Audited `AI_READ_TOOL_EXECUTED` events in current period | `PlatformAudit` | `createdAt` |
| `organization.*` | Visible organization entities by hierarchy level | Organization tables | Current state |

## Comparisons

Lead, application, and enrollment cards compare the current elapsed period with the same elapsed duration in the preceding calendar period. Change is `(current - previous) / previous x 100`. A zero previous count yields `null`, not an infinite or fabricated percentage.

## Excluded Claims

Phase 11 deliberately defines no synthetic retention, institutional health, employee performance, engagement, risk, forecast, accounting revenue, or cross-currency total. Existing operational pages may have local statistics, but they are not promoted into executive truth without a reviewed metric definition.

