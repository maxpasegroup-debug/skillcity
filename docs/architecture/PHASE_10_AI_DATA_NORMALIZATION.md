# Phase 10 AI Data Normalization

## Existing Data Inventory

The pre-Phase 10 AI implementation contains `AIConversation`, `AIMessage`, `PromptTemplate`, `AIUsageLog`, `AIFeedback`, and `TokenUsage`. Tara is the only established assistant experience. Existing rows are preserved by the additive migration.

Database-backed counts were not collected because the available database environment was not explicitly confirmed as safe development. No production data was changed.

## Safe Automatic

- Upsert the single `tara` assistant policy by stable code.
- Add nullable assistant and organization-context links to existing conversations.
- Add nullable assistant, request, measured-token, output-type, and sanitized-error fields to usage logs.
- Create the empty action-proposal table and indexes.
- Upsert Phase 10 permissions and intended role grants.
- Leave all existing conversations, messages, prompts, feedback, usage, and token records unchanged.

## Manual Review Required

- Decide whether historical Tara conversations should be linked to the `tara` assistant. The migration does not guess this association.
- Review historical `AIUsageLog.error` values for provider response text before any cleanup or retention operation.
- Determine whether historical `estimatedTokens` represent actual provider usage. They are not copied into the new measured token fields.
- Approve retention periods for conversations, context snapshots, feedback, proposal payloads, and audit records.
- Review stored conversation context for previously captured email addresses or unnecessarily broad community data.

## Blocked

- Live counts and content classification require explicitly approved read-only database inspection.
- Historical redaction requires an approved retention/redaction policy and production backup procedure.
- Backfilling assistant IDs or measured usage cannot be safely automated without authoritative source evidence.

## Prohibited Normalization

Do not invent token counts, assistant ownership, organization scope, proposal outcomes, or historical tool executions. Do not rewrite prompts, conversations, or feedback without an approved migration plan.
