# Runtime Bootstrap and Read-Path Mutation Audit

Audit scope: `app`, `server`, `actions`, `features`, and `lib`. Ordinary command-side mutations are not bootstrap defects; this document records setup/default creation and mutations hidden behind query/read-style APIs.

## Findings

| Location | Function / callers | Mutation | Problem | Proposed destination | Migration risk |
| --- | --- | --- | --- | --- | --- |
| `server/admissions/queries.ts` | `ensureDefaultPipeline`; called by admission/admin dashboards, telecaller/counsellor reads, settings pages and actions | Updates or creates 24 pipeline stages and upserts Website lead source | GET/page rendering writes; every call updates existing stages; concurrent setup can contend; deployment correctness depends on traffic | Versioned seed/setup command plus explicit reference-data migration; reads use a pure lookup | High: stage IDs/orders and existing custom stages are production data |
| `server/altt/queries.ts` | `getLearningSession`, `requireLearningSession` | Upserts `DailyLearningSession`, setting status to `IN_PROGRESS` | Opening/rendering learning content changes progress state; retries/prefetch can create activity | Explicit `startLearningSession` command invoked by user intent, with idempotent key | Medium: UX currently relies on implicit creation |
| `server/community/queries.ts` | `getOrCreateWallet`, called by `getCommunityData` | Upserts a `Wallet` | Community page reads create financial-like records; future monetary semantics make this unsafe | Account provisioning or explicit wallet activation command | Medium: existing users may rely on lazy provisioning |
| `server/success/queries.ts` | `getOrCreatePortfolio`, called by `getSuccessData` | Creates `StudentPortfolio` and public slug | Dashboard reads publish/create identity-bearing records; route prefetch can trigger creation | Student activation provisioning or explicit portfolio setup command | Medium: preserve unique public slug generation and existing URLs |
| `server/ai/prompts.ts` | `ensurePromptTemplates` | Upserts every prompt template and reactivates status | Runtime call can overwrite operator-edited content/status and hides release/config changes | Versioned seed or controlled admin migration with immutable versions | High: prompt content affects AI behavior and auditing |
| `actions/public-application.ts` | `ensureWebsiteProgramAndReferrer` | Upserts Website source and public `Program` from static launch config | Public submissions bootstrap catalog/reference records; content changes become writes on traffic | Deployment seed/sync command owned by program catalog | High: program IDs link applications and enrollments |

## Confirmed Read-Path Callers for Admissions Bootstrap

- `getAdmissionDashboard`
- `getAdmissionWorkspaceData`
- `getTelecallerWorkspace`
- `getTelecallerLeadDetail`
- `getCounsellorWorkspace`
- `getCounsellorLeadDetail`
- `getAdminCommandCenter`
- `/admissions/settings`
- `/admin/settings`

The same helper is also used appropriately as command-side setup by admissions, public application, telecaller and counsellor actions. Consolidation should replace both categories with a stable reference-data lookup after explicit setup exists.

## Non-Bootstrap Mutations Reviewed

- `server/auth/session.ts` creates/revokes sessions as explicit authentication commands.
- `server/whatsapp/service.ts` writes a delivery log as part of a send command.
- `server/audit/log.ts`, `server/director/log.ts`, and AI memory/usage functions persist explicit events.
- Admissions, trainer and executive server actions mutate in response to commands.

These may need later service boundaries, but they are not hidden dashboard/read bootstrapping.

## Removal Preconditions

1. Inventory production reference data and detect local/custom pipeline stages.
2. Make setup idempotent and runnable before application traffic.
3. Add monitoring for missing required reference records.
4. Add characterization tests for each current lazy-created record.
5. Deploy pure reads only after setup has run successfully in every environment.

No runtime mutation was removed in Phase 0.
