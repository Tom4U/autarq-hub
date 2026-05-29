# autarq-hub — AI Agent Context

> Read this file before touching any code.

## Project Overview

**autarq-hub** is an open-source, self-hosted orchestration platform for personal and business management.
It is **not** a data silo — it connects external systems via a connector layer and stores only metadata, references, and native items.

**License:** GPL-3.0

## Non-Negotiable: Spec-First BDD Workflow

```text
1. Check specs/features/ for an existing scenario covering the change
2. If none exists → write the .feature scenario first
3. Run tests → they MUST be red first
4. Write the minimal implementation to make the scenario green
5. Refactor — keep all scenarios green
6. Commit: .feature + implementation + passing tests together
```

**Never:**

- Write implementation code before a `.feature` scenario exists
- Modify a `.feature` file to make a failing test pass — fix the implementation
- Merge with any red scenario

## Architecture: Connector-First

All external data comes through connectors. The DB stores only:

- Connector configurations (encrypted credentials)
- Cross-system references and dedup markers
- Native items: tasks, manual accounts, blog content, budget rules
- Computed/aggregated values

**Never** store email content, calendar event bodies, file content, or banking transaction details directly in the DB.

### What is stored — and what is not

| Data | Stored in autarq-hub DB |
| --- | --- |
| Email content | References only (Message-ID → Invoice-ID) |
| Calendar events | Cross-links only (Event-ID → Task-ID) |
| Files | Paths/references + metadata |
| Contacts | Dedup markers + CRM extensions |
| Bank statements | Aggregated values + transaction references |
| **Tasks** | **Fully owned** |
| **Manual accounts** | **Fully owned** |
| **Blog content** | **Fully owned** |
| **Budget rules** | **Fully owned** |
| **Outgoing invoices** | **Fully owned** |

## Key Directories

```text
specs/features/       ← Single Source of Truth for all behaviour
specs/step-definitions/
packages/connectors/src/interface/   ← IConnector interfaces (never break these)
packages/core/        ← Business logic (no direct DB access, uses connectors)
packages/db/          ← Drizzle schema + migrations only
apps/web/             ← Next.js frontend + tRPC API routes
```

## Connector Pattern

Every connector implements a typed interface. Business logic depends on the interface, never on a concrete class. Every connector has a `mock.ts` — use `MockXConnector` in all BDD/unit tests.

```typescript
// packages/connectors/src/interface/
// Implementations are interchangeable:
const emailConnector: IEmailConnector =
  config.provider === 'gmail'  ? new GmailConnector(config) :
  config.provider === 'm365'   ? new M365Connector(config) :
                                  new ImapConnector(config)
```

### Connector Consistency Contract

| Aspect | Rule |
| --- | --- |
| Idempotency | All sync operations must be idempotent — no duplicates on re-sync |
| External ID tracking | Every synced record stores `externalId` (source system ID) |
| Retry strategy | Exponential backoff via BullMQ, max 5 attempts, then dead-letter queue + notification |
| Eventual consistency | autarq-hub may lag behind source systems (email: 15 min · banking: daily · calendar/contacts: on-demand + 15 min) |
| Tombstone pattern | Delete → mark `deleted` → push to source → revert on failure, log to audit |
| Conflict marker | When source overrides a write: `conflict: true` on record, non-blocking UI notification |

### Write Strategy by Domain

| Domain | Strategy | Write from autarq-hub |
| --- | --- | --- |
| Banking (FinTS, PayPal) | Source-only (read-only) | Not allowed |
| Incoming email | Source-only | Not allowed |
| Sending email | Write-to-source | Create new resource in source system |
| Calendar | Optimistic write + source wins | Push patch; source wins on conflict |
| Contacts | Optimistic write + source wins | Push patch; source wins on conflict |
| Files / Storage | Bidirectional, configurable | Upload/delete via connector |
| Native items (tasks, accounts…) | autarq-hub authoritative | Fully owned |

## Security Requirements (non-negotiable)

- Connector credentials: AES-256-GCM, key from `AUTARQ_ENCRYPTION_KEY` env var, `key_version` field on every encrypted record
- Passwords: Argon2id via better-auth — never stored in plain text, never in logs
- Audit log: append-only, tombstone on account deletion (`AUTARQ_AUDIT_PEPPER` env var)
- IP in audit log: set to NULL after 90 days via retention job
- Never log credentials, tokens, or passwords
- Role check (`owner` / `accountant`) on every tRPC procedure — unauthorized calls rejected with HTTP 403 and written to audit log
- Transport: TLS 1.2+ for all external connector connections
- HSTS header in Next.js middleware

### Role Model

| Role | Access |
| --- | --- |
| `owner` | Full access (default) |
| `accountant` | Read-only: finance/bookkeeping only |

### OWASP ASVS Level 1 (minimum)

| Area | Requirement | Implementation |
| --- | --- | --- |
| Auth (V2) | Strong passwords, MFA support | better-auth + Zod |
| Session (V3) | Secure/HttpOnly cookies, expiry, invalidation on logout | better-auth |
| Access Control (V4) | Role check on every API endpoint | tRPC middleware |
| Input Validation (V5) | All inputs validated, output encoding against XSS | Zod + React DOM |
| Cryptography (V6) | No MD5/SHA1 for security, credentials encrypted | AES-256-GCM |
| Logging (V7) | No credentials in logs, audit log for security events | Audit log service |
| API Security (V13) | Rate limiting, no credentials in URLs | Next.js middleware |

### Key Lifecycle (`AUTARQ_ENCRYPTION_KEY`)

| Aspect | Rule |
| --- | --- |
| Key versioning | Every encrypted field stores `key_version` (integer) — allows multiple active keys during rotation |
| Key rotation | Set new key in env + increment `key_version`; BullMQ re-encryption job re-encrypts all old-version records |
| Backup | `AUTARQ_ENCRYPTION_KEY` **must** be backed up separately from the DB backup |
| Key loss | Encrypted connector credentials are unrecoverable — recovery: re-enter manually. User data (invoices, tasks, blog) is unaffected |

### Audit Log

Security-relevant events in the `audit_log` table. Fields: `timestamp`, `user_id`, `action`, `ip_address`, `resource_type`, `resource_id`, `outcome`.

| Event | Logged |
| --- | --- |
| Login successful / failed | ✓ |
| Logout | ✓ |
| Connector added / removed | ✓ |
| Invoice sent | ✓ (finance-relevant → 10-year retention) |
| User data export (GDPR) | ✓ |
| Account deleted | ✓ |
| Role change | ✓ |

**Retention:** General events deleted after 3 years. Finance-relevant events (e.g. `invoice-sent`) retained for 10 years (GoBD).

**Tombstone on account deletion:** `user_id` replaced by `DELETED:{sha256(original_user_id + deletion_timestamp + AUTARQ_AUDIT_PEPPER)}`. The pepper is a separate env secret, independent of `AUTARQ_ENCRYPTION_KEY`. Hash is deterministic — tombstone-hash correlation across entries is possible for forensics, but re-identification is not.

**IP addresses:** Automatically set to NULL after 90 days via BullMQ retention job.

### GDPR Checklist

| Right / Obligation | Requirement | Phase |
| --- | --- | --- |
| Access (Art. 15) | Display all stored data on request | Phase 0b |
| Erasure (Art. 17) | Account deletion: all native data + connector credentials | Phase 0b |
| Data portability (Art. 20) | Export native data as JSON (Phase 0b); extend with connector metadata (Phase 1) | Phase 0b + 1 |
| Data minimisation (Art. 5) | Store only necessary data — no email content in DB | Architecture |
| Retention periods | Tax-relevant data 10 years (GoBD), configurable retention service | Phase 2 |
| Privacy by design (Art. 25) | Encryption, data minimisation, role model | Architecture |
| Records of processing (Art. 30) | Exportable processing register for commercial use | Phase 3 |

## Phase Gates

A phase is only complete when:

1. All `.feature` scenarios in scope are green
2. Living Docs (HTML report) are published to GitHub Pages
3. No scenario in the backlog is red for this scope

## Completed: Phase 0a ✅

Goal: CI/CD pipeline green, first Cucumber scenario green.
See: `specs/features/system/app-health.feature`

Living Docs deploy: `.github/workflows/pages.yml` publishes `cucumber-report.html`
as `index.html` to GitHub Pages (`https://tom4u.github.io/autarq-hub/`) after every
successful CI run on `main`.

## Current Phase: 0b

Goal: Auth, security foundations, audit log.

Scope:

- `better-auth` integration with Argon2id password hashing
- Role model: `owner` / `accountant` on every tRPC procedure
- Audit log: append-only, tombstone on account deletion, IP retention job (NULL after 90 days)
- Connector credential encryption: AES-256-GCM, `AUTARQ_ENCRYPTION_KEY`, `key_version` field
- DB schema: users, sessions, audit_log, connector_configs (Drizzle + PostgreSQL)

Feature files under `specs/features/auth/` (all created — status: red, pending implementation):

- `login.feature` — registration (incl. Argon2id hash verification) + login/logout/session expiry
- `roles.feature` — owner vs. accountant access, 403 enforcement, real role transition scenarios
- `gdpr.feature` — Art. 15 (access), Art. 17 (erasure incl. credentials), Art. 20 (JSON export)
- `audit-log.feature` — correct event writing, pepper-based tombstone, IP→NULL after 90d, 3/10yr retention
- `key-lifecycle.feature` — AES-256-GCM round-trip, key_version field, rotation re-encryption, idempotency

Note: registration scenarios live in `login.feature` (same auth domain).
Note: credential encryption scenarios live in `key-lifecycle.feature`.
Step definitions for auth features are pending — to be added in `specs/step-definitions/auth.steps.ts`.

## Roadmap (summary)

| Phase | Goal | Issue |
| --- | --- | --- |
| 0a ✅ | CI/CD pipeline + first green scenario | — |
| 0b 🔄 | Auth, security foundations, audit log | (current) |
| 1 | Communication: email, calendar, contacts, files | #3 |
| 2 | Finance & invoicing, banking, manual accounts | #4 |
| 3 | CRM, tasks, projects, time tracking | #5 |
| 4 | Blogs, mobile (PWA + Capacitor), cloud connectors | #6 |

Tech Stack & Out-of-Scope ADR: `docs/adr/tech-stack.md`
