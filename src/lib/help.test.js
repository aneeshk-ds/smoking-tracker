import { describe, it, expect } from 'vitest'
import { HELP } from './help'

describe('HELP copy map', () => {
  it('every entry has a non-empty label and text', () => {
    for (const [key, v] of Object.entries(HELP)) {
      expect(v, key).toBeTruthy()
      expect(typeof v.label, key).toBe('string')
      expect(v.label.length, key).toBeGreaterThan(0)
      expect(typeof v.text, key).toBe('string')
      expect(v.text.length, key).toBeGreaterThan(10)
    }
  })
  it('covers the core home + legend keys the UI references', () => {
    const required = [
      'goal','orb','streak','smokingRun','reason','logButton','craving',
      'spendToday','onTargetRate','projectedCost','insight','todayLog',
      'legendOnTarget','legendOverTarget','legendNoData',
      'insTotal','insAvg','insDaily','insTriggers','insProjection',
      'healthReached','healthUpcoming',
      'setGoal','setBrand','setAppearance','setDemo',
    ]
    for (const k of required) expect(HELP[k], k).toBeTruthy()
  })
  it('text stays concise (<= 320 chars) so tooltips fit', () => {
    for (const [key, v] of Object.entries(HELP)) {
      expect(v.text.length, key).toBeLessThanOrEqual(320)
    }
  })
})
