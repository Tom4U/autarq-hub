import { describe, expect, it } from 'vitest'
import { checkSpecCoupling } from '../check-spec-coupling.mjs'

describe('check-spec-coupling', () => {
  it('passes when no source files changed', () => {
    const result = checkSpecCoupling({
      changedFiles: ['README.md'],
      commits: ['feat: something'],
      hasSpecChange: false,
    })
    expect(result.ok).toBe(true)
  })

  it('passes when source changed and spec also changed', () => {
    const result = checkSpecCoupling({
      changedFiles: ['packages/core/src/auth.ts'],
      commits: ['feat: add auth'],
      hasSpecChange: true,
    })
    expect(result.ok).toBe(true)
  })

  it('blocks when feat/fix source changed without spec change', () => {
    const result = checkSpecCoupling({
      changedFiles: ['packages/core/src/auth.ts'],
      commits: ['feat: add auth'],
      hasSpecChange: false,
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('Spec-coupling gate')
  })

  it('passes when only chore commits (no feat/fix) even without spec change', () => {
    const result = checkSpecCoupling({
      changedFiles: ['packages/core/src/auth.ts'],
      commits: ['chore: update deps'],
      hasSpecChange: false,
    })
    expect(result.ok).toBe(true)
  })

  it('passes when source changed is only test files (no spec required)', () => {
    const result = checkSpecCoupling({
      changedFiles: ['packages/core/src/auth.test.ts'],
      commits: ['feat: add tests'],
      hasSpecChange: false,
    })
    expect(result.ok).toBe(true)
  })

  it('passes when source changed is only .test.mts files (no spec required)', () => {
    const result = checkSpecCoupling({
      changedFiles: ['packages/core/src/auth.test.mts'],
      commits: ['feat: add tests'],
      hasSpecChange: false,
    })
    expect(result.ok).toBe(true)
  })

  it('blocks when mix of feat commits and non-test source without spec', () => {
    const result = checkSpecCoupling({
      changedFiles: [
        'packages/core/src/auth.ts',
        'packages/core/src/auth.test.ts',
      ],
      commits: ['feat: add auth', 'test: add auth tests'],
      hasSpecChange: false,
    })
    expect(result.ok).toBe(false)
  })

  it('lists the affected source files in reason', () => {
    const result = checkSpecCoupling({
      changedFiles: ['packages/core/src/auth.ts'],
      commits: ['feat: add auth'],
      hasSpecChange: false,
    })
    expect(result.reason).toContain('packages/core/src/auth.ts')
  })
})
