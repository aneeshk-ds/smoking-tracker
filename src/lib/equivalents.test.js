import { describe, it, expect } from 'vitest'
import { getEquivalents, equivalentLine } from './equivalents'

describe('getEquivalents', () => {
  it('returns at most 3, sorted by count desc', () => {
    const r = getEquivalents(10000, 'INR')
    expect(r.length).toBeLessThanOrEqual(3)
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].count).toBeGreaterThanOrEqual(r[i].count)
    }
  })
  it('only includes items you can afford at least one of', () => {
    const r = getEquivalents(150, 'INR') // below most INR items
    for (const e of r) expect(e.count).toBeGreaterThanOrEqual(1)
  })
  it('falls back to USD table for unknown currency', () => {
    const r = getEquivalents(1000, 'ZZZ')
    expect(Array.isArray(r)).toBe(true)
  })
  it('returns empty when nothing is affordable', () => {
    expect(getEquivalents(0, 'INR')).toEqual([])
  })
})

describe('equivalentLine', () => {
  it('formats a plural line', () => {
    const line = equivalentLine(100000, 'INR')
    expect(line).toMatch(/^= \d+ /)
  })
  it('returns null when nothing affordable', () => {
    expect(equivalentLine(0, 'INR')).toBeNull()
  })
})
