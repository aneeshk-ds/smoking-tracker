import { describe, it, expect } from 'vitest'
import { getCompanion, companionMood, companionLine, companionEmoji, COMPANION_TYPES } from './companion'

describe('getCompanion', () => {
  it('defaults sensibly when unset', () => {
    const c = getCompanion(null)
    expect(c.enabled).toBe(false)
    expect(c.type).toBe('sprout')
    expect(c.name).toBe('Buddy')
  })
  it('reads saved companion', () => {
    const c = getCompanion({ companion: { enabled: true, type: 'ember', name: 'Blaze' } })
    expect(c).toEqual({ enabled: true, type: 'ember', name: 'Blaze' })
  })
})

describe('companionMood', () => {
  it('over target today → struggling', () => {
    expect(companionMood({ count: 10, goal: 'reduce', dailyTarget: 8 })).toBe('struggling')
  })
  it('on target today + good rate → thriving', () => {
    expect(companionMood({ count: 4, goal: 'reduce', dailyTarget: 8, onTargetRate: 80 })).toBe('thriving')
  })
  it('low recent rate → struggling even if today ok', () => {
    expect(companionMood({ count: 0, goal: 'quit', onTargetRate: 20 })).toBe('struggling')
  })
  it('middling → ok', () => {
    expect(companionMood({ count: 4, goal: 'reduce', dailyTarget: 8, onTargetRate: 50 })).toBe('ok')
  })
})

describe('companionLine', () => {
  it('speaks in first person with the name', () => {
    const l = companionLine({ name: 'Blaze', type: 'ember', mood: 'thriving', goal: 'reduce', dailyTarget: 8, count: 4, hour: 21 })
    expect(l.startsWith('Blaze:')).toBe(true)
    expect(l).toContain('4')
  })
  it('struggling line is supportive, not shaming', () => {
    const l = companionLine({ name: 'Leaf', mood: 'struggling' })
    expect(l.toLowerCase()).toContain('not going anywhere')
  })
})

describe('types', () => {
  it('has 3 companion types with emoji', () => {
    expect(COMPANION_TYPES).toHaveLength(3)
    expect(companionEmoji('ember')).toBe('🔥')
    expect(companionEmoji('unknown')).toBe('🌱')
  })
})
