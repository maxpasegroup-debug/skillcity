# ADR-001: Identity and Authentication

- Status: Accepted for current transition
- Date: 2026-09-27

## Context

The application uses a custom opaque-session architecture. Login creates a random token, stores only its SHA-256 hash in `Session.tokenHash`, and places the raw token in the HTTP-only `skillcity_session` cookie. Sessions expire after 30 days and can be revoked. Passwords and student PINs use bcrypt. Email OTP and password-reset records exist.

Admissions can create student users, roles, activation profiles, enrollments and WhatsApp PIN credentials. This couples identity provisioning to admission orchestration but is live business behavior.

## Decision

Retain the custom `User` / `Role` / `UserRole` / `Session` foundation during Phase 1. Do not replace the authentication provider while permissions and organization scope are being introduced. Separate authentication (who the principal is) from authorization (what the principal may do).

New identity work must preserve opaque server-side sessions, hashed stored tokens, secure cookies, revocation and status checks. Student credential issuance should eventually move behind an identity service contract, while admissions remains the triggering workflow.

## Security Requirements

- HTTP-only, Secure in production, SameSite cookie policy and explicit expiry.
- Session rotation after credential changes and privilege changes.
- Revocation for logout, suspension, deletion and credential compromise.
- Constant-time/standard-library password and PIN verification.
- Rate limits for login, OTP, reset and public status flows using shared storage.
- Audit events for authentication and identity lifecycle changes without plaintext secrets.
- No PIN, OTP, token or password in logs or analytics.
- Account enumeration resistance and normalized identity identifiers.

## Unresolved Decisions

- Session idle timeout versus fixed lifetime and multi-device management.
- Whether `AUTH_SECRET` signs ancillary tokens or is removed from this architecture.
- MFA requirements for privileged roles.
- Email versus WhatsApp identity recovery policy.
- External identity provider/SSO needs for employees.
- Exact boundary and idempotency contract for student provisioning.

## Consequences

The application avoids a risky provider migration during authorization work. Existing auth technical debt remains visible and must be characterized before redesign.
