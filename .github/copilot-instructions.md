# GitHub Copilot — autarq-hub Project Instructions

## Core Principle: Spec-First BDD

Before writing any code, check `specs/features/` for an existing scenario.
If none exists, write the `.feature` scenario first. Only implement what is needed to make a failing scenario pass.

## Architecture

- **Connector-First**: all external data comes through `packages/connectors/`.
  Never query external APIs directly from `packages/core/` or `apps/web/`.
- **DB footprint is minimal**: only metadata, references, and native items.
  No email content, no calendar event bodies, no file content.
- **IConnector interfaces** are the contract — business logic depends on the interface, never a concrete implementation.
- **MockConnectors** are used in all tests — never make real network calls in tests.

## Security

- Connector credentials: AES-256-GCM, `AUTARQ_ENCRYPTION_KEY`, `key_version` field mandatory on every encrypted record
- Passwords: Argon2id via better-auth
- Audit log: append-only, tombstone on deletion, IP set to NULL after 90 days
- Role checks (owner / accountant) required on every tRPC procedure
- Never log credentials, tokens, or API keys

## Code Style

- TypeScript strict mode, no `any`
- Zod schemas for all API inputs and outputs
- Drizzle ORM for all DB operations — no raw SQL except in migrations
- tRPC procedures in `apps/web/src/server/routers/`
- Shared types in `packages/core/src/types/`

## Testing

- Unit tests: Vitest (`*.test.ts`)
- BDD scenarios: Cucumber + Gherkin (`specs/features/**/*.feature`)
- E2E: playwright-bdd (Phase 1+)
- Always use `MockConnectors` — never real network calls in tests
- Mock clock for time-based retention scenarios

## Monorepo

- `pnpm` only — never `npm install`
- `turbo run <task>` to run tasks across packages
- Import from packages using workspace aliases: `@autarq/db`, `@autarq/core`, `@autarq/connectors`, `@autarq/ui`

## Baseline checks — run before every suggestion

1. **Spec exists?** — Is there a `.feature` scenario in `specs/features/` for this behaviour? If not, write it first.
2. **Role guard?** — Does every tRPC procedure check `ctx.session.user.role`? Unauthorized → HTTP 403 + audit log entry.
3. **Interface, not concrete?** — Does business logic depend on `IConnector` interface, not a concrete class?
4. **Mock in test?** — Does the test use `MockXConnector`, not a real network call?
5. **Credential encrypted?** — Does any connector config write use `encryptCredential()` with `key_version`?
6. **Audit log written?** — Is this a security-relevant action?
   (login, logout, connector add/remove, invoice send, role change, account delete, GDPR export)
   → must write to `audit_log`.
7. **i18n keys present?** — Does the change introduce any UI text? Both `en` and `de` locale keys must be in the same PR.
8. **No secrets in logs?** — Confirm no credentials, tokens, or session data flow through any logger.

## Guardrails

| Guardrail | Rule |
| --- | --- |
| No raw SQL | Drizzle ORM only — raw SQL allowed only in migration files |
| No direct DB in `packages/core` | Core uses connector interfaces; DB access is in `packages/db` |
| No email/calendar content in DB | Store reference IDs only — never message bodies or event details |
| No `any` in TypeScript | `strict: true` everywhere; use `unknown` + type guard if needed |
| No hard-coded display text | All UI strings via locale keys — `apps/web/src/locales/{en,de}.json` |
| No re-sync duplicates | All sync ops idempotent — check `externalId` before insert |
| No silent delete | Deletes use tombstone pattern: mark `deleted`, push to source, revert + log on failure |
| No unvalidated input | All tRPC inputs validated with Zod at procedure boundary |

## Known failure modes

| Failure mode | Symptom | Fix |
| --- | --- | --- |
| Missing role check | 403 not thrown for `accountant` on write endpoint | Add `requireRole('owner')` guard in tRPC middleware |
| Plain-text credential in DB | `connector_configs` row has readable secret | Wrap with `encryptCredential()`; add `key_version` field |
| Real network call in test | Flaky tests; BDD scenarios depend on external service | Replace concrete connector with `Mock<Domain>Connector` |
| Feature without `.feature` | Implementation merged without BDD scenario | Write scenario first, observe RED, then implement |
| Hard-coded UI string | Untranslatable text in component template | Move to `en.json` + `de.json`; use `$t('key')` |
| Missing `key_version` field | Rotation job cannot re-encrypt old records | Add `key_version: integer('key_version').notNull()` to Drizzle schema |
| Audit log gap | Security event not traceable | Add `auditLog.write(event)` call in the relevant service method |
| Conflict not marked | Source override silently overwrites local change | Set `conflict: true` on record; emit non-blocking UI notification |
| IP not nulled after 90d | GDPR retention violation | Ensure BullMQ retention job covers `audit_log.ip_address` |

## Response style — Minimal (Default)

Goal: maximum information density, minimal token usage.

Rules:

- no preamble, closing, pleasantries, repetition, filler words
- content only
- bullet points + short terms preferred

Structure: lists / key-value, max 8–12 points, clear organization.

Context: primary current request; prior conversation only if critical.

Limits: ≤ 120 tokens — actively compress if exceeded.

Fallback: when uncertain → terse; no speculation.

Output style: technical · precise · compact.

Overrides (current request only, then back to Minimal):

- `MIN`    → keywords only, no sentences, max 80 tokens
- `MEDIUM` → compact + brief explanation
- `DETAIL` → detailed, examples, no token limit

Priority: brevity > style · information density > readability.
