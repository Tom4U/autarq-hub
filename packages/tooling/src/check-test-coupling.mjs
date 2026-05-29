// SDD/TDD-Gate: feat/fix commits that touch source files must also stage tests.
// Additionally: if existing test lines are modified (not just added), the commit
// message must carry a "Test-Change-Reason: <text>" trailer explaining why.

/** @typedef {{ ok: boolean; reason: string }} CouplingResult */

const EXEMPT_TYPES = new Set([
  'chore', 'docs', 'refactor', 'style', 'ci', 'build', 'test', 'revert', 'perf',
])

const SOURCE_PATTERN = /^(apps|packages)\/[^/]+\/src\/.+\.(ts|tsx)$/
const TEST_PATTERN = /\.(test|spec)\.(ts|tsx|mts|js|mjs)$|\/(tests?|spec)\//

/**
 * @param {string} message - commit message
 * @param {string[]} stagedFiles - staged file paths
 * @param {{ modifiedTestLines?: number }} [opts]
 * @returns {CouplingResult}
 */
export function checkTestCoupling(message, stagedFiles, opts = {}) {
  const firstLine = message.split('\n')[0]
  const typeMatch = /^([a-z]+)(?:\([^)]+\))?!?:/.exec(firstLine)
  const type = typeMatch ? typeMatch[1] : ''

  if (EXEMPT_TYPES.has(type)) {
    return { ok: true, reason: '' }
  }

  const sourceChanged = stagedFiles.filter((f) => SOURCE_PATTERN.test(f))
  const testChanged = stagedFiles.some((f) => TEST_PATTERN.test(f))

  // Gate 1: feat/fix touching source must include at least one test file.
  if (sourceChanged.length > 0 && !testChanged) {
    return {
      ok: false,
      reason:
        'SDD/TDD-Gate: feat/fix commits require accompanying test changes.\n' +
        'Source files staged without matching tests:\n' +
        sourceChanged.map((f) => `  - ${f}`).join('\n'),
    }
  }

  // Gate 2: existing test lines modified → require Test-Change-Reason trailer.
  const modifiedTestLines = opts.modifiedTestLines ?? 0
  if (modifiedTestLines > 0) {
    const hasTrailer = /^Test-Change-Reason: .+/m.test(message)
    if (!hasTrailer) {
      return {
        ok: false,
        reason:
          'Test-immutability gate: existing test lines were modified.\n' +
          'Add a trailer: Test-Change-Reason: <why these existing tests had to change>',
      }
    }
  }

  return { ok: true, reason: '' }
}

// CLI entry point — only runs when executed directly.
if (process.argv[1] && new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\', '/'))) {
  const { execFileSync } = await import('node:child_process')
  const { readFileSync } = await import('node:fs')

  const msgFile = process.argv[2]
  if (!msgFile) {
    console.error('check-test-coupling: missing commit-msg file path')
    process.exit(1)
  }

  const message = readFileSync(msgFile, 'utf8').trim()

  const stagedFiles = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=ACMR'],
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean)

  // Compute modified test lines via numstat.
  const testFiles = stagedFiles.filter((f) => TEST_PATTERN.test(f))
  let modifiedTestLines = 0
  if (testFiles.length > 0) {
    const numstat = execFileSync(
      'git',
      ['diff', '--cached', '--numstat', '--', ...testFiles],
      { encoding: 'utf8' },
    )
    modifiedTestLines = numstat
      .split('\n')
      .filter(Boolean)
      .reduce((acc, line) => {
        const parts = line.split('\t')
        return acc + Number.parseInt(parts[1] ?? '0', 10)
      }, 0)
  }

  const result = checkTestCoupling(message, stagedFiles, { modifiedTestLines })
  if (!result.ok) {
    console.error('')
    console.error(result.reason)
    console.error('')
    process.exit(1)
  }

  process.exit(0)
}
