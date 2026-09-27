# Phase 0 Deferred Issues

| Issue | Location | Severity | Reason deferred | Planned phase |
| --- | --- | --- | --- | --- |
| Authenticated non-students can reach student/community/success guards | `server/journey/queries.ts`, `server/community/queries.ts`, `server/success/queries.ts` | High | Requires authorization policy decision; Phase 1 scope | Phase 1 |
| Hardcoded role-name authorization lacks permissions and scope | `server/*/queries.ts`, layouts/actions | High | Explicitly excluded from Phase 0 | Phase 1 |
| Runtime bootstrap mutates during reads | See `RUNTIME_BOOTSTRAP_AUDIT.md` | High | Production data migration and characterization required | Phase 1 foundation / owning-domain phase |
| Duplicate admissions payment/activation paths | Admissions action files | High | Production-critical consolidation needs tests and data review | CRM/Admissions phase |
| WhatsApp provider logs message/PIN and reports `SENT` | `server/whatsapp/provider.ts` | High | Real provider architecture explicitly deferred | Communications phase |
| Public application status uses WhatsApp number as lookup proof | `actions/public-application.ts` | High | Product/security decision and safer verification flow needed | Phase 1/security or Admissions phase |
| `/email-previews` is statically exposed | `app/email-previews/page.tsx` | Medium | Gating/removal is outside baseline setup | Phase 1/security hardening |
| In-memory public rate limiting is per-process | `lib/security/rate-limit.ts` | High at scale | Shared limiter/provider work deferred | Phase 1/security hardening |
| Payment model has no gateway/webhook/reconciliation | Admissions/finance modules | High | Payments ADR only in this task | Finance phase |
| Documents are arbitrary URLs without ACL/signed access | `StudentDocument`, forms and content models | High | Storage migration explicitly deferred | Documents phase |
| Automation has models/UI but no runner | Executive automation files | Medium | Engine implementation explicitly deferred | Automation phase |
| CI has no database-backed integration tests | `.github/workflows/ci.yml` | Medium | Requires test database/fixtures and isolation strategy | Phase 1 quality track |
| Dependency ranges use `latest` | `package.json` | Medium | Broad dependency policy change could alter production build | Phase 1 repository hardening |
| Node pin is 20.11.1 while local validation used 22.14.0 | `.node-version`, `.nvmrc` | Medium | Requires team/runtime compatibility decision | Phase 1 repository hardening |
| npm reports extraneous transitive packages | local `node_modules` | Low | Local install state; `npm ci` will recreate from lockfile | Local maintenance |
| `SystemSetting.encrypted` has no discovered encryption service | schema/executive settings | High for secrets | Requires secure key-management design | Phase 1/security |
| Wide live dashboard queries and limited pagination | admin/executive/community/trainer queries | Medium | Performance redesign is not baseline work | Executive/performance phase |
| No durable email delivery/retry/bounce logs | `server/email/provider.ts` | Medium | Communications platform deferred | Communications phase |
| `AUTH_SECRET` is validated but not used by current opaque session tokens | `lib/env.ts`, `server/auth/session.ts` | Low/decision | Custom sessions hash random tokens; future auth ADR must decide its role | Phase 1 |

No listed issue was silently fixed during Phase 0.
