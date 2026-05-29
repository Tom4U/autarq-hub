import { describe, expect, it } from 'vitest'
import { auditSpecLinks, type AuditResult } from '../audit-spec-links.mjs'

// autarq-hub uses Cucumber .feature files, not markdown specs.
// AC format in .feature tags: @AC-<prefix>-<NN> (e.g. @AC-login-01)
// AC format in test files:    // AC-<prefix>-<NN>  or  AC-<prefix>-<NN>: ...

describe('audit-spec-links', () => {
  it('returns ok when every feature AC has a matching test reference', () => {
    const result = auditSpecLinks({
      featureAcs: new Map([['login.feature', new Set(['AC-login-01', 'AC-login-02'])]]),
      testRefs: new Map([['AC-login-01', new Set(['auth.test.ts'])], ['AC-login-02', new Set(['auth.test.ts'])]]),
      allowlist: new Set(),
    })
    expect(result.ok).toBe(true)
    expect(result.orphanedAcs).toHaveLength(0)
  })

  it('reports orphaned AC when no test references it and not in allowlist', () => {
    const result = auditSpecLinks({
      featureAcs: new Map([['login.feature', new Set(['AC-login-01'])]]),
      testRefs: new Map(),
      allowlist: new Set(),
    })
    expect(result.ok).toBe(false)
    expect(result.orphanedAcs).toContain('AC-login-01')
  })

  it('accepts orphaned AC when it is in the allowlist', () => {
    const result = auditSpecLinks({
      featureAcs: new Map([['login.feature', new Set(['AC-login-01'])]]),
      testRefs: new Map(),
      allowlist: new Set(['AC-login-01']),
    })
    expect(result.ok).toBe(true)
    expect(result.orphanedAcs).toHaveLength(0)
  })

  it('reports stale allowlist entry when AC is no longer orphaned', () => {
    const result = auditSpecLinks({
      featureAcs: new Map([['login.feature', new Set(['AC-login-01'])]]),
      testRefs: new Map([['AC-login-01', new Set(['auth.test.ts'])]]),
      allowlist: new Set(['AC-login-01']),
    })
    expect(result.ok).toBe(false)
    expect(result.staleAllowlistEntries).toContain('AC-login-01')
  })

  it('reports stale allowlist entry when AC no longer exists in any feature', () => {
    const result = auditSpecLinks({
      featureAcs: new Map(),
      testRefs: new Map(),
      allowlist: new Set(['AC-login-99']),
    })
    expect(result.ok).toBe(false)
    expect(result.staleAllowlistEntries).toContain('AC-login-99')
  })

  it('warns on orphaned test references but does not fail', () => {
    const result = auditSpecLinks({
      featureAcs: new Map(),
      testRefs: new Map([['AC-ghost-01', new Set(['ghost.test.ts'])]]),
      allowlist: new Set(),
    })
    expect(result.ok).toBe(true)
    expect(result.orphanedTestRefs).toContain('AC-ghost-01')
  })

  it('handles multiple feature files correctly', () => {
    const result = auditSpecLinks({
      featureAcs: new Map([
        ['login.feature', new Set(['AC-login-01'])],
        ['roles.feature', new Set(['AC-roles-01'])],
      ]),
      testRefs: new Map([['AC-login-01', new Set(['auth.test.ts'])]]),
      allowlist: new Set(),
    })
    expect(result.ok).toBe(false)
    expect(result.orphanedAcs).toContain('AC-roles-01')
    expect(result.orphanedAcs).not.toContain('AC-login-01')
  })
})
