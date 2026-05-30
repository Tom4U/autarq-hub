# Contributing to autarq-hub

## Branch Strategy

```text
feat/* / fix/* / chore/* ──PR──▶ main    (CI must be green)
release-please creates release branches automatically
```

| Branch | Purpose |
| --- | --- |
| `main` | Always deployable. Protected — PR-only. |
| `feat/<name>` | New feature (e.g. `feat/email-connector`) |
| `fix/<name>` | Bug fix |
| `chore/<name>` | Tooling, deps, config — no production code |
| `refactor/<name>` | Restructuring without behaviour change |
| `docs/<name>` | Documentation only |

### Typical Workflow

```bash
# 1. Cut branch from main
git switch main && git pull
git switch -c feat/my-feature

# 2. Write .feature scenario first (BDD-first — see below)

# 3. Observe RED, then implement until GREEN

# 4. Push and open draft PR
git push -u origin feat/my-feature
gh pr create --draft --fill

# 5. Wait for ci-ready to undraft, then squash-merge
# 6. Delete branch after merge
```

### Rules

- No direct push to `main`.
- One feature/fix per PR — keep PRs focused.
- All scenarios must be green before merge.
- No `--no-verify`, no hook bypass.
- Use `git switch`/`git restore`, not `git checkout`.

## BDD-First Workflow (mandatory)

autarq-hub follows a strict Spec-First BDD contract:

1. Check `specs/features/` for an existing scenario covering the change.
2. If none → write the `.feature` scenario first.
3. Run `pnpm test:bdd` → **must be red**.
4. Write the minimal implementation to make it green.
5. Refactor — keep all scenarios green.
6. Commit `.feature` + implementation + passing tests together.

**Never** write implementation code before a `.feature` scenario exists.  
**Never** modify a `.feature` file to make a failing test pass — fix the implementation.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(auth): add Argon2id password hashing
fix(connector): handle token refresh race condition
chore(deps): upgrade drizzle-orm to 0.40.0
chore(meta): add CONTRIBUTING.md — no behaviour change, BDD-gate N/A
```

Breaking changes: `!` after the type or `BREAKING CHANGE:` in the footer.

## Issue Labels

### Type (exactly one)

- `bug` — defect with expected/actual deviation
- `feature` — new or extended functionality
- `tech-debt` — maintainability improvement, no new user function
- `spec-pending` — implementation blocked by missing/unclear spec
- `documentation` — documentation as primary content
- `research` — spike / investigation
- `question` — clarification needed before implementation
- `roadmap` — strategically planned topic (add alongside type label)
- `upstream-blocked` — blocked by an upstream library/action not yet releasing a compatible version

### Priority (exactly one for actionable issues)

- `priority:critical`
- `priority:high`
- `priority:medium`
- `priority:low`

### Automation labels (do not set manually)

- `autorelease: pending` / `autorelease: tagged` — release-please
- `dependencies` — dependabot

## Release Process

autarq-hub uses [release-please](https://github.com/googleapis/release-please) with per-package
tagging. Releases are fully automated from Conventional Commits on `main` — never bump `version`
fields by hand.

Component tags: `autarq-hub-v*`, `web-v*`, `core-v*`, `db-v*`, `connectors-v*`, `ui-v*`.

## Code Style

- TypeScript strict, no `any`, explicit return types.
- Prettier formatting — enforced by `pnpm lint`.
- Comments only for the non-obvious **why** — never the what.
- All inputs validated with Zod at system boundaries.
- No credentials, tokens, or passwords in logs.

## Local Development

```bash
pnpm install          # install all workspace dependencies
pnpm lint             # ESLint + Prettier + markdownlint
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest unit tests
pnpm test:bdd         # Cucumber BDD scenarios
pnpm build            # full build
```

Open issues and bugs in the [Issue Tracker](https://github.com/tom4u/autarq-hub/issues).
