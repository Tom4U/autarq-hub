# ADR: Tech Stack & Deliberate Out-of-Scope Decisions

> Tracked in git. Kept in `docs/adr/` as a living decision record.

## Decision Principle

Solo development → maximum end-to-end type safety, minimal boilerplate, good tooling support, all open source.

## Frontend

| Technology | Rationale |
| --- | --- |
| **Next.js 15** (App Router) | Full-stack, SSG for blogs/SEO, API routes, PWA support |
| **TypeScript** | End-to-end type safety |
| **shadcn/ui** | Fully customisable, no UI vendor lock-in |
| **Tailwind CSS** | Fast development, consistent design |
| **React Query (TanStack)** | Data fetching, caching, background sync |

## API & Backend

| Technology | Rationale |
| --- | --- |
| **tRPC** | Type-safe API without code generation, perfect for Next.js |
| **Next.js API Routes** | No separate server, easy to deploy |
| **BullMQ + Redis** | Jobs: recurring invoices, bank sync, email sync, retries |
| **Zod** | Schema validation, shared between frontend and backend |

## Database & Auth

| Technology | Rationale |
| --- | --- |
| **PostgreSQL** | Robust, open source, self-hostable, good JSON support |
| **Drizzle ORM** | Lightweight, TypeScript-native, SQL-close, fast migrations |
| **better-auth** | Open source, self-hosted, Argon2id passwords, MFA, OAuth |
| **Redis** | BullMQ backend + session cache |

## Connectors & Protocols

| Library | Purpose |
| --- | --- |
| `imapflow` | IMAP client |
| `nodemailer` | SMTP |
| `tsdav` | CalDAV + CardDAV |
| `node-fints` | FinTS/HBCI for German banks |
| PayPal REST API | Transaction history |
| fileee API | Invoice archive (bidirectional) |
| `@react-pdf/renderer` | Invoice PDF generation |
| ZUGFeRD / XRechnung | German e-invoicing format |

## BDD & Testing

| Technology | Purpose |
| --- | --- |
| `@cucumber/cucumber` | BDD framework |
| `cucumber-tsflow` | TypeScript-native step definitions |
| `@cucumber/html-formatter` | Living Docs HTML report |
| `playwright-bdd` | E2E BDD with Gherkin + Playwright |
| `testcontainers` | Real PostgreSQL/Redis in integration tests |
| In-memory MockConnectors | Stub `IConnector` implementations for unit/BDD tests |
| MailHog | SMTP trap in dev/test |

## Monorepo & Tooling

| Technology | Purpose |
| --- | --- |
| Turborepo | Monorepo build system with caching |
| pnpm Workspaces | Package management |
| Vitest | Unit tests (complementing BDD) |
| ESLint + Prettier | Code quality |

## Mobile & Deployment

| Technology | Purpose |
| --- | --- |
| PWA | Mobile first (no app store required) |
| Capacitor | Native iOS/Android wrapper (Phase 4+) |
| Docker + Docker Compose | Portable full environment |
| GitHub Actions | CI/CD pipeline |
| MinIO | Self-hosted S3-compatible storage |

## Deliberate Out-of-Scope Decisions

| Decision | Reason |
| --- | --- |
| No microservice architecture — monolith (Next.js) | Solo development; monolith is the right trade-off |
| No own email server | IMAP/SMTP client only — no MTA complexity |
| No own calendar/contacts server | CalDAV/CardDAV client only |
| No real-time collaboration | Single-user / household use case |
| No enterprise multi-tenancy | Out of scope by design |
| PSD2 / GoCardless optional only | Sparkasse & Baader Bank do not support PSD2 |
| No strong consistency for connector sync | Eventual consistency accepted; conflict markers shown in UI |
