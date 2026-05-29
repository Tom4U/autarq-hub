// Spec ↔ Test linkage audit for autarq-hub (Cucumber BDD).
//
// AC format in .feature files:  @AC-<prefix>-<NN>  (Cucumber scenario tags)
// AC format in test/step files: AC-<prefix>-<NN>  (inline comments or strings)
//
// Reports:
//   - Orphaned ACs   = declared in a .feature, no matching test ref → exit 1
//                       unless listed in .spec-audit-allowlist.json
//   - Stale allowlist = in allowlist but AC is no longer orphaned → exit 1
//   - Orphaned tests = referenced in test, no matching AC → warns only (exit 0)

/** @typedef {{ ok: boolean; orphanedAcs: string[]; staleAllowlistEntries: string[]; orphanedTestRefs: string[] }} AuditResult */

const AC_PATTERN = /(AC-[a-zA-Z0-9]+-\d+)\b/g

/**
 * @param {{ featureAcs: Map<string, Set<string>>; testRefs: Map<string, Set<string>>; allowlist: Set<string> }} opts
 * @returns {AuditResult}
 */
export function auditSpecLinks({ featureAcs, testRefs, allowlist }) {
  const allFeatureIds = new Set()
  for (const ids of featureAcs.values()) for (const id of ids) allFeatureIds.add(id)

  const allTestIds = new Set(testRefs.keys())

  const allOrphanedAcs = [...allFeatureIds].filter((id) => !allTestIds.has(id)).sort()
  const unallowlistedOrphans = allOrphanedAcs.filter((id) => !allowlist.has(id))

  // Stale = in allowlist but AC is either covered by a test or gone from all features.
  const staleAllowlistEntries = [...allowlist]
    .filter((id) => !allOrphanedAcs.includes(id))
    .sort()

  const orphanedTestRefs = [...allTestIds].filter((id) => !allFeatureIds.has(id)).sort()

  const ok = unallowlistedOrphans.length === 0 && staleAllowlistEntries.length === 0

  return {
    ok,
    orphanedAcs: unallowlistedOrphans,
    staleAllowlistEntries,
    orphanedTestRefs,
  }
}

// CLI entry point — only runs when executed directly.
if (process.argv[1] && new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\', '/'))) {
  const { existsSync, readdirSync, readFileSync, statSync } = await import('node:fs')
  const { join } = await import('node:path')

  const ROOT = process.cwd()
  const FEATURE_DIR = join(ROOT, 'specs', 'features')
  const STEP_DIRS = [join(ROOT, 'specs', 'step-definitions')]
  const ALLOWLIST_FILE = join(ROOT, '.spec-audit-allowlist.json')

  function walkDir(dir, predicate) {
    const out = []
    let entries
    try { entries = readdirSync(dir) } catch { return out }
    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...walkDir(full, predicate))
      else if (predicate(full)) out.push(full)
    }
    return out
  }

  // Collect ACs from .feature files (tags + inline references).
  const featureAcs = new Map()
  const featureFiles = walkDir(FEATURE_DIR, (f) => f.endsWith('.feature'))
  for (const file of featureFiles) {
    const content = readFileSync(file, 'utf8')
    const ids = new Set()
    for (const m of content.matchAll(AC_PATTERN)) ids.add(m[1])
    if (ids.size > 0) featureAcs.set(file, ids)
  }

  // Collect AC references from step-definition test files.
  const testRefs = new Map()
  for (const dir of STEP_DIRS) {
    const files = walkDir(dir, (f) => /\.(ts|mts|js|mjs)$/.test(f))
    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      for (const m of content.matchAll(AC_PATTERN)) {
        const id = m[1]
        if (!testRefs.has(id)) testRefs.set(id, new Set())
        testRefs.get(id).add(file)
      }
    }
  }

  // Load allowlist.
  let allowlist = new Set()
  if (existsSync(ALLOWLIST_FILE)) {
    const parsed = JSON.parse(readFileSync(ALLOWLIST_FILE, 'utf8'))
    if (!Array.isArray(parsed)) {
      console.error('.spec-audit-allowlist.json must be a JSON array of AC IDs')
      process.exit(1)
    }
    allowlist = new Set(parsed)
  }

  const result = auditSpecLinks({ featureAcs, testRefs, allowlist })

  const totalFeatureAcs = [...featureAcs.values()].reduce((n, s) => n + s.size, 0)
  console.log(`Feature ACs declared:     ${totalFeatureAcs}`)
  console.log(`Test references:          ${testRefs.size}`)
  console.log(`Acknowledged orphans:     ${allowlist.size} (in .spec-audit-allowlist.json)`)
  console.log(`Unacknowledged orphans:   ${result.orphanedAcs.length}`)
  console.log('')

  if (result.orphanedAcs.length > 0) {
    console.error('ERROR — Orphaned ACs (declared in .feature, no matching test, not in allowlist):')
    for (const id of result.orphanedAcs) console.error(`  - ${id}`)
    console.error('')
  }

  if (result.staleAllowlistEntries.length > 0) {
    console.error('ERROR — Stale allowlist entries:')
    for (const id of result.staleAllowlistEntries) console.error(`  - ${id}`)
    console.error('')
  }

  if (result.orphanedTestRefs.length > 0) {
    console.warn('WARN — Orphaned test references (test mentions ID, .feature does not):')
    for (const id of result.orphanedTestRefs) {
      console.warn(`  - ${id}`)
      for (const file of testRefs.get(id)) console.warn(`      ${file}`)
    }
    console.warn('')
  }

  if (result.ok) {
    console.log('OK: every AC is covered by a test or explicitly allowlisted.')
  }

  process.exit(result.ok ? 0 : 1)
}
