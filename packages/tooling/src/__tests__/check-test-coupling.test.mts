import { describe, expect, it } from 'vitest'
import { checkTestCoupling } from '../check-test-coupling.mjs'

describe('check-test-coupling', () => {
  it('allows chore commits without tests', () => {
    const result = checkTestCoupling('chore: update config', [])
    expect(result.ok).toBe(true)
  })

  it('allows docs commits without tests', () => {
    const result = checkTestCoupling('docs: update README', [])
    expect(result.ok).toBe(true)
  })

  it('allows refactor commits without tests', () => {
    const result = checkTestCoupling('refactor: extract helper', [])
    expect(result.ok).toBe(true)
  })

  it('allows ci commits without tests', () => {
    const result = checkTestCoupling('ci: add workflow', [])
    expect(result.ok).toBe(true)
  })

  it('blocks feat commit that touches source without tests', () => {
    const result = checkTestCoupling('feat: add user auth', [
      'packages/core/src/auth.ts',
    ])
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('SDD/TDD-Gate')
  })

  it('blocks fix commit that touches source without tests', () => {
    const result = checkTestCoupling('fix: null pointer in auth', [
      'apps/web/src/pages/login.ts',
    ])
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('SDD/TDD-Gate')
  })

  it('passes feat commit that includes a test file', () => {
    const result = checkTestCoupling('feat: add user auth', [
      'packages/core/src/auth.ts',
      'packages/core/src/auth.test.ts',
    ])
    expect(result.ok).toBe(true)
  })

  it('passes feat commit that includes a spec-dir test', () => {
    const result = checkTestCoupling('feat: add user auth', [
      'packages/core/src/auth.ts',
      'packages/core/src/tests/auth.ts',
    ])
    expect(result.ok).toBe(true)
  })

  it('passes feat commit that includes a .test.mts file', () => {
    const result = checkTestCoupling('feat: add user auth', [
      'packages/core/src/auth.ts',
      'packages/core/src/auth.test.mts',
    ])
    expect(result.ok).toBe(true)
  })

  it('counts .test.mts as a test file for immutability gate', () => {
    const result = checkTestCoupling(
      'feat: update auth\n\nSome body.',
      ['packages/core/src/auth.test.mts'],
      { modifiedTestLines: 1 },
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('Test-immutability gate')
  })

  it('ignores files outside apps/packages source pattern for gate 1', () => {
    const result = checkTestCoupling('feat: add workflow', [
      '.github/workflows/ci.yml',
    ])
    expect(result.ok).toBe(true)
  })

  it('blocks feat with source and .feature file but no unit test', () => {
    const result = checkTestCoupling('feat: add user auth', [
      'packages/core/src/auth.ts',
      'specs/features/auth/login.feature',
    ])
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('SDD/TDD-Gate')
  })

  it('requires Test-Change-Reason trailer when test lines are modified', () => {
    const result = checkTestCoupling(
      'feat: update auth\n\nSome body.',
      ['packages/core/src/auth.test.ts'],
      { modifiedTestLines: 1 },
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('Test-immutability gate')
  })

  it('accepts modified test lines when Test-Change-Reason trailer is present', () => {
    const result = checkTestCoupling(
      'feat: update auth\n\nTest-Change-Reason: spec AC-01 changed',
      ['packages/core/src/auth.test.ts'],
      { modifiedTestLines: 1 },
    )
    expect(result.ok).toBe(true)
  })
})
