# Phase 9 Communications And Automation Data Normalization

## Inventory

### Email

- **KEEP / CENTRALIZE:** `server/email/provider.ts` and the existing Resend dependency.
- **KEEP:** authentication and account emails that already call this provider.
- **EXTEND:** provider response now distinguishes unconfigured queueing from provider submission.
- **FUTURE:** migrate eligible business templates into `CommunicationTemplate`; do not migrate authentication secrets or OTP values into general templates without a separate security review.

### WhatsApp

- **KEEP:** `server/whatsapp/provider.ts`, `service.ts`, approved admission template, and `WhatsAppMessageLog` compatibility.
- **CENTRALIZE:** future WhatsApp delivery must use the central provider boundary and `CommunicationMessage`.
- **DEPRECATE:** treating the log-only adapter as successful delivery. It now returns `QUEUED / UNCONFIGURED`.
- **SAFE AUTOMATIC:** redact new approved-admission credential bodies before writing the legacy log.
- **MANUAL REVIEW REQUIRED:** existing `WhatsAppMessageLog` rows containing `Temporary PIN:` or OTP markers. Do not rewrite or delete production history automatically.
- **BLOCKED:** delivery/webhook verification until a real provider, provider template IDs, signing secret, and Railway endpoint are configured.

### Notifications

- **KEEP:** `Notification` and all existing trainer/academic notification producers.
- **EXTEND:** optional unique link to a central communication record.
- **SAFE AUTOMATIC:** no backfill is required; new automated in-app messages create the link transactionally.
- **MANUAL REVIEW REQUIRED:** none unless historical notifications need reporting by organization.

### CRM Communication History

- **KEEP:** `CommunicationLog` as the CRM follow-up and interaction timeline.
- **DO NOT MIGRATE:** it is not proof of provider delivery and must not be relabelled as such.
- **FUTURE:** link a CRM interaction to a central message when an actual external send is introduced.

### Automation

- **KEEP / EXTEND:** `AutomationRule` and `AutomationExecution`.
- **KEEP:** legacy trigger/action values for compatibility; they are not executed by the Phase 9 event worker.
- **CENTRALIZE:** new event rules use stable codes, organization scope, idempotent execution, bounded attempts, and constrained action configuration.
- **MANUAL REVIEW REQUIRED:** existing rules with free-form `conditions` and `actionConfig` before any future executor supports them.
- **DEPRECATE:** the old executive creation screen; it redirects to the controlled automation operations view.

### Queue And Scheduler

- **CURRENT:** no durable external queue, worker, cron contract, or scheduler was found.
- **EXTEND:** `DomainEvent` is the durable outbox/job record.
- **BLOCKED:** unattended background processing until Railway worker/cron ownership is explicitly configured.
- **DO NOT USE:** Next.js in-process timers as a scheduler.

### Provider Configuration

- **KEEP WITH REVIEW:** `NotificationProvider` names and statuses.
- **MANUAL REVIEW REQUIRED:** inspect existing `config` values for secrets without printing them. Future secrets belong only in environment configuration.

## Read-Only Audit

Run after the migration in an approved database environment:

```bash
npm run audit:communications
```

The script reports aggregate counts only. It does not print addresses, message bodies, payloads, credentials, provider configuration, or secrets. It identifies legacy WhatsApp rows with credential markers as a count for manual review.

## No Automatic Data Guessing

Phase 9 does not infer consent, provider delivery, template ownership, organization scope, recipient preference, or historical automation outcomes. No legacy record is deleted or silently reclassified.
