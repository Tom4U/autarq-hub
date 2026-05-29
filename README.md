# autarq-hub

> *From German "autark" — self-sufficient, independent, in control.*

An open-source, self-hosted orchestration platform for personal and business management. Not a data silo — autarq-hub is the intelligent centre that connects, deduplicates, and orchestrates your external systems.

**License:** [GPL-3.0](./LICENSE)

---

## Vision

autarq-hub replaces vendor-locked SaaS tools with a single self-hosted platform that:

- acts **not** as a data silo but as an **orchestration layer** — data stays in its source systems
- connects external services through a **Connector-First architecture** — providers are freely interchangeable
- stores only metadata, references, and native items locally
- is **cloud- and hosting-agnostic** (Docker, VPS, local — all supported)

## Features (planned)

- 📧 Email, Calendar, Contacts (IMAP/SMTP, CalDAV, CardDAV, Gmail, M365)
- 💶 Outgoing & incoming invoices, banking (FinTS/HBCI, PayPal), bookkeeping
- 👥 CRM, projects, time tracking
- ✅ Tasks, lists, notes
- 📝 Multi-blog with custom domains (SSG, SEO-ready)
- 📱 PWA first, Capacitor native app (Phase 4+)

## Tech Stack

Next.js 15 · TypeScript · tRPC · Drizzle ORM · PostgreSQL · Redis · BullMQ · better-auth · shadcn/ui · Tailwind CSS · Turborepo · pnpm

## Development

```bash
# Prerequisites: Node.js 20+, pnpm 9+, Docker

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis + MailHog + MinIO)
docker compose -f docker/docker-compose.dev.yml up -d

# Start dev server
pnpm dev

# Run BDD scenarios (Cucumber)
pnpm test:bdd

# Run unit tests (Vitest)
pnpm test
```

## Development Philosophy

**Spec-First BDD → TDD.** No implementation without a `.feature` scenario.

See [CLAUDE.md](./CLAUDE.md) for full workflow and architecture rules.

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| 0a | Infrastructure, CI/CD, first green scenario | ✅ Done |
| 0b | Auth, security foundations, audit log | 🔄 In Progress |
| 1 | Email, Calendar, Contacts | ⏳ Planned |
| 2 | Finance & Invoicing | ⏳ Planned |
| 3 | CRM, Tasks, Projects | ⏳ Planned |
| 4 | Blogs, Mobile, Ecosystem | ⏳ Planned |

## Contributing

autarq-hub is open source under GPL-3.0. Contributions welcome — please read [CLAUDE.md](./CLAUDE.md) for the development workflow before opening a PR.
