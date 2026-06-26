import { describe, it, expect } from 'vitest'
import { computeSmokingStreak, computeHonestStreak } from './streaks'

function day(offset) {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toISOString().slice(0, 10)
}

describe('computeSmokingStreak', () => {
  it('returns 0 with no data', () => {
    expect(computeSmokingStreak([]).currentRun).toBe(0)
  })
  it('counts consecutive smoking days back from today', () => {
    const r = computeSmokingStreak([
      { date: day(0), count: 3 },
      { date: day(1), count: 2 },
      { date: day(2), count: 0 },
    ])
    expect(r.currentRun).toBe(2)
    expect(r.longestRun).toBeGreaterThanOrEqual(2)
  })
})

describe('computeHonestStreak', () => {
  it('reports days free when clean today (quit mode)', () => {
    const r = computeHonestStreak([
      { date: day(0), count: 0 },
      { date: day(1), count: 0 },
      { date: day(2), count: 1 },
    ], { goal: 'quit' })
    expect(r.mode).toBe('quitting')
    expect(r.isCleanToday).toBe(true)
    expect(r.daysSinceLast).toBe(2)
  })
  it('awareness mode has no streak text', () => {
    expect(computeHonestStreak([], { goal: 'awareness' }).displayText).toBeNull()
  })
})
