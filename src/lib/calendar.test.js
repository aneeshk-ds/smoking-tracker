import { describe, it, expect } from 'vitest'
import { dayBand, cellLevel, buildCalendarGrid } from './achievements'

describe('dayBand', () => {
  it('quit: 0 is on target, anything is over', () => {
    expect(dayBand(0, 'quit', null)).toBe('good')
    expect(dayBand(1, 'quit', null)).toBe('over')
  })
  it('reduce: at or under the target is on target', () => {
    expect(dayBand(0, 'reduce', 5)).toBe('good')
    expect(dayBand(5, 'reduce', 5)).toBe('good')   // exactly at limit counts
    expect(dayBand(6, 'reduce', 5)).toBe('over')
  })
  it('awareness has no target → neutral', () => {
    expect(dayBand(0, 'awareness', null)).toBe('neutral')
    expect(dayBand(9, 'awareness', null)).toBe('neutral')
  })
})

describe('cellLevel (darker = more cigarettes)', () => {
  it('good day: 0 cigs is lightest, near the target is darkest', () => {
    expect(cellLevel('good', 0, 5)).toBe(0)
    expect(cellLevel('good', 5, 5)).toBe(4)
    expect(cellLevel('good', 0, 5)).toBeLessThan(cellLevel('good', 4, 5))
  })
  it('quit good day is always the lightest (target 0)', () => {
    expect(cellLevel('good', 0, null)).toBe(0)
  })
  it('over day deepens the further over you go', () => {
    const near = cellLevel('over', 6, 5)   // 1 over
    const far  = cellLevel('over', 20, 5)  // way over
    expect(near).toBeGreaterThanOrEqual(1) // always visibly red
    expect(far).toBe(4)
    expect(far).toBeGreaterThan(near)
  })
  it('never returns a level outside 0..4', () => {
    for (const c of [0, 1, 5, 12, 99]) {
      const lvl = cellLevel('over', c, 5)
      expect(lvl).toBeGreaterThanOrEqual(0)
      expect(lvl).toBeLessThanOrEqual(4)
    }
  })
})

describe('buildCalendarGrid', () => {
  const settings = { goal: 'reduce', dailyTarget: 5 }
  const grid = buildCalendarGrid([], settings, 12)
  it('is 12 weeks of 7 days', () => {
    expect(grid.length).toBe(12)
    for (const week of grid) expect(week.length).toBe(7)
  })
  it('every cell has a date, band, and count field', () => {
    const allowed = new Set(['good', 'over', 'neutral', 'empty', 'future'])
    for (const week of grid) for (const day of week) {
      expect(typeof day.date).toBe('string')
      expect(allowed.has(day.band)).toBe(true)
      expect('count' in day).toBe(true)
    }
  })
  it('classifies recorded days against the target', () => {
    const today = new Date().toISOString().slice(0, 10)
    const g = buildCalendarGrid([{ date: today, count: 8 }], settings, 12)
    const cell = g.flat().find((d) => d.date === today)
    expect(cell.band).toBe('over')
    expect(cell.count).toBe(8)
  })
})
