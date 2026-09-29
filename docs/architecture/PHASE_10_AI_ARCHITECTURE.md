# Phase 10 AI Architecture

## Purpose

AIRA AI Core governs AI use inside the existing AIRA Skill City Core. Tara remains the first assistant. The architecture does not give a model direct database, HTTP, file-system, or business-action access.

## Runtime Flow

`authenticated user -> Tara scope permission -> minimal context -> registered assistant -> provider adapter -> validated response -> conversation + measured usage + audit`

Every request remains attributable to the authenticated `User`, the `AIAssistant`, its `AIConversation`, the selected organization context, and a unique usage request ID.

## Assistant Registry

`AIAssistant` is the authoritative assistant policy record. It contains a stable code, status, description, allowed domains, and allowed tool codes. Phase 10 registers only `tara`; it does not create multiple overlapping assistants.

The registry contains policy, not provider credentials or hidden system prompts. Provider secrets remain server environment variables. Prompt templates remain system-controlled code-backed records.

## Provider Boundary

`AIGenerationProvider` supports text generation, streaming capability, and schema-validated structured output. The initial adapter uses OpenAI Responses through server-side `fetch`; the rest of the application depends on the interface rather than OpenAI-specific response shapes.

Configuration is centralized in `server/ai/config.ts`. Public configuration exposes provider, model, timeout, and configured state only. Provider response bodies are never placed in application errors or usage logs. Stable error codes are used for unavailable, timeout, rejected, and malformed responses.

Token values are persisted only when reported by the provider. Phase 10 does not estimate or invent token usage.

## Context And Privacy

Tara context construction enforces the requested Tara permission inside the context service, in addition to route authorization. Student success and community context is provided only for `STUDENT`; CRM context remains permission- and organization-scoped for admissions and BDM. User email is no longer sent to the model.

Authorized records are wrapped as untrusted data in the system prompt. Embedded instructions in records, notes, reflections, or other context cannot override the system policy. The prompt explicitly forbids implicit writes and secret disclosure.

Conversation reuse requires the same user and the same conversation scope. Feedback requires an assistant message in a conversation owned by the submitting user.

## Controlled Tools

The code-defined registry separates `READ` from `WRITE_PROPOSAL` tools:

- `academic.get-own-progress`
- `career.get-own-profile`
- `crm.get-lead-summary`
- `communications.propose-notification`

Each tool has a Zod input schema, permission requirement, assistant allowlist check, and independent domain authorization. Read tools call scoped domain services. The registry does not expose Prisma or arbitrary query execution to the model. Read executions create a metadata-only `PlatformAudit` record.

The notification tool cannot execute directly. It exists only to validate an action proposal.

## Human Approval

`AIActionProposal` stores a typed write intent, actor, assistant, tool, organization context, reason, status, reviewer, and timestamps. Actor-scoped idempotency keys prevent duplicate proposals.

An approver must hold `ai.approve` and must cover the proposal's recorded organization scope. Approval or rejection is audited. In Phase 10, approval does not execute the proposed business mutation. A later phase may add explicit per-tool executors after separate risk review.

## Permissions

- `ai.use`: generic AI capability foundation
- `ai.manage`: assistant policy management foundation
- `ai.audit`: governance and usage visibility
- `ai.approve`: scoped human proposal review

Existing Tara permissions (`ai.student`, `ai.trainer`, `ai.admission`, `ai.bdm`, `ai.director`) remain authoritative for current Tara entry points, preserving behavior.

## UI

Existing Tara interfaces remain unchanged. `/ai` adds a compact governance view for authorized auditors: provider configuration state, registered assistant policy, measured usage foundation, and proposal history. It does not expose prompts, secrets, arbitrary tool execution, or fake metrics.

## Audit And Retention

AI read tools and proposal decisions reuse `PlatformAudit`. `AIUsageLog` records assistant, request ID, provider/model, output type, timing, measured tokens when available, success, and sanitized error code. Existing conversations, messages, feedback, and token records are preserved.

Retention periods and automated redaction/deletion are deferred pending an approved organization-wide data retention policy.

## Deferred

- Autonomous action execution
- RAG/vector storage
- External web browsing and arbitrary HTTP tools
- Multi-agent orchestration
- AI billing and cost allocation
- Model training/fine-tuning
- Mass communications
- Automated finance, HR, employment, or academic grading decisions
- Advanced executive prediction and Phase 11 work
