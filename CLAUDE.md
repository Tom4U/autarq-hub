# autarq-hub — AI Agent Context

> Read this file before touching any code.

## Project Overview

**autarq-hub** is an open-source, self-hosted orchestration platform for personal and business management.
It is **not** a data silo — it connects external systems via a connector layer and stores only metadata, references, and native items.

**License:** GPL-3.0

## Non-Negotiable: Spec-First BDD Workflow

```
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

## Key Directories

```
specs/features/       ← Single Source of Truth for all behaviour
specs/step-definitions/
packages/connectors/src/interface/   ← IConnector interfaces (never break these)
packages/core/        ← Business logic (no direct DB access, uses connectors)
packages/db/          ← Drizzle schema + migrations only
apps/web/             ← Next.js frontend + tRPC API routes
```

## Connector Pattern

```typescript
// Every connector implements a typed interface
// packages/connectors/src/interface/

// Implementations are interchangeable — business logic depends on the interface, never on a concrete class
// Every connector has a mock.ts for tests — use MockXConnector in all BDD/unit tests
```

## Security Requirements (non-negotiable)

- Connector credentials: AES-256-GCM, key from `AUTARQ_ENCRYPTION_KEY` env var, `key_version` field on every encrypted record
- Passwords: Argon2id via better-auth
- Audit log: append-only, tombstone on account deletion (`AUTARQ_AUDIT_PEPPER` env var)
- IP in audit log: set to NULL after 90 days via retention job
- Never log credentials, tokens, or passwords
- Role check (owner / accountant) on every tRPC procedure

## Phase Gates

A phase is only complete when:
1. All `.feature` scenarios in scope are green
2. Living Docs (HTML report) are published to GitHub Pages
3. No scenario in the backlog is red for this scope

## Current Phase: 0a

Goal: CI/CD pipeline green, first Cucumber scenario green.
See: `specs/features/system/app-health.feature`

Living Docs deploy: `.github/workflows/pages.yml` publishes `cucumber-report.html`
as `index.html` to GitHub Pages (`https://tom4u.github.io/autarq-hub/`) after every
successful CI run on `main`.
