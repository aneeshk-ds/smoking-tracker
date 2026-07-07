import { describe, it, expect } from 'vitest'
import { hasNewVersion } from './updater'

describe('hasNewVersion', () => {
  it('flags a genuinely newer build', () => {
    expect(hasNewVersion('100', '200')).toBe(true)
  })
  it('does not flag the same build', () => {
    expect(hasNewVersion('200', '200')).toBe(false)
  })
  it('never flags in dev', () => {
    expect(hasNewVersion('dev', '200')).toBe(false)
  })
  it('ignores missing/failed remote lookups', () => {
    expect(hasNewVersion('100', null)).toBe(false)
    expect(hasNewVersion('100', undefined)).toBe(false)
    expect(hasNewVersion('100', '')).toBe(false)
  })
  it('ignores missing current id', () => {
    expect(hasNewVersion('', '200')).toBe(false)
    expect(hasNewVersion(null, '200')).toBe(false)
  })
})
