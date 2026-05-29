// CI gate: feat/fix commits that touch source files must have a matching spec
// change somewhere in the same branch (since it diverged from the base branch).
//
// Bypass: set SPEC_COUPLING_EXEMPT=1 locally.

/** @typedef {{ ok: boolean; reason: string }} SpecCouplingResult */

const SOURCE_PATTERN = /^(apps|packages)\/[^/]+\/src\/.+\.(ts|tsx)$/
const TEST_PATTERN = /\.(test|spec)\.(ts|tsx|mts|js|mjs)$|\/(tests?|spec)\//
const FEAT_FIX_PATTERN = /^(feat|fix)(\([^)]+\))?!?:/

/**
 * @param {{ changedFiles: string[]; commits: string[]; hasSpecChange: boolean }} opts
 * @returns {SpecCouplingResult}
 */
export function checkSpecCoupling({ changedFiles, commits, hasSpecChange }) {
  const sourceChanged = changedFiles.filter(
    (f) => SOURCE_PATTERN.test(f) && !TEST_PATTERN.test(f),
  )

  if (sourceChanged.length === 0 || hasSpecChange) {
    return { ok: true, reason: '' }
  }

  const hasFeatFix = commits.some((msg) => FEAT_FIX_PATTERN.test(msg))
  if (!hasFeatFix) {
    return { ok: true, reason: '' }
  }

  return {
    ok: false,
    reason:
      'Spec-coupling gate: feat/fix commits that touch source files require a spec change.\n' +
      'Source files changed without a matching update in specs/:\n' +
      sourceChanged.map((f) => `  - ${f}`).join('\n'),
  }
}

// CLI entry point — only runs when executed directly.
if (process.argv[1] && new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\', '/'))) {
  const { execFileSync } = await import('node:child_process')

  const exempt = process.env['SPEC_COUPLING_EXEMPT'] === '1'
  if (exempt) {
    console.log('check-spec-coupling: SPEC_COUPLING_EXEMPT=1 — skipping.')
    process.exit(0)
  }

  const base = process.env['GITHUB_BASE_REF'] || 'main'
  if (!/^[\w./-]+$/.test(base)) {
    console.error(`check-spec-coupling: invalid base ref "${base}" — aborting.`)
    process.exit(1)
  }

  const isCI = Boolean(process.env['CI'])

  let changedFiles
  try {
    changedFiles = execFileSync(
      'git',
      ['diff', '--name-only', `origin/${base}...HEAD`],
      { encoding: 'utf8' },
    )
      .split('\n')
      .filter(Boolean)
  } catch {
    if (isCI) {
      console.error(
        `check-spec-coupling: could not diff against origin/${base}.` +
        ' Ensure fetch-depth: 0 in the checkout step.',
      )
      process.exit(1)
    }
    console.log(`check-spec-coupling: could not diff against origin/${base} — skipping locally.`)
    process.exit(0)
  }

  let commits
  try {
    commits = execFileSync(
      'git',
      ['log', '--format=%s', `origin/${base}...HEAD`],
      { encoding: 'utf8' },
    )
      .split('\n')
      .filter(Boolean)
  } catch {
    if (isCI) process.exit(1)
    process.exit(0)
  }

  const hasSpecChange = changedFiles.some((f) => f.startsWith('specs/'))
  const result = checkSpecCoupling({ changedFiles, commits, hasSpecChange })

  if (!result.ok) {
    console.error('')
    console.error(result.reason)
    console.error('')
    process.exit(1)
  }

  process.exit(0)
}
