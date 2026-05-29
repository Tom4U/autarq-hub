# GitHub Copilot — autarq-hub Project Instructions

## Core Principle: Spec-First BDD

Before writing any code, check `specs/features/` for an existing scenario.
If none exists, write the `.feature` scenario first. Only implement what is needed to make a failing scenario pass.

## Architecture

- **Connector-First**: all external data comes through `packages/connectors/`. Never query external APIs directly from `packages/core/` or `apps/web/`.
- **DB footprint is minimal**: only metadata, references, and native items. No email content, no calendar event bodies, no file content.
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