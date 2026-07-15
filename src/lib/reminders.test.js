import { describe, it, expect } from 'vitest'
import { getReminderConfig, DEFAULT_REMINDERS, pickNudge, dueReminderId } from './reminders'

describe('getReminderConfig', () => {
  it('defaults to 4 meal-time reminders, disabled', () => {
    const c = getReminderConfig(null)
    expect(c.enabled).toBe(false)
    expect(c.times).toHaveLength(4)
  })
  it('reads saved config', () => {
    const c = getReminderConfig({ reminders: { enabled: true, times: [{ id: 'x', time: '09:00', on: true }] } })
    expect(c.enabled).toBe(true)
    expect(c.times).toHaveLength(1)
  })
  it('falls back to defaults when times empty', () => {
    expect(getReminderConfig({ reminders: { enabled: true, times: [] } }).times).toHaveLength(4)
  })
})

describe('pickNudge', () => {
  it('evening: reduce + on target → feel-good', () => {
    const n = pickNudge({ count: 4, goal: 'reduce', dailyTarget: 8, hour: 21 })
    expect(n.tone).toBe('good')
    expect(n.text).toContain('4/8')
  })
  it('evening: quit + smoke-free → win', () => {
    expect(pickNudge({ count: 0, goal: 'quit', hour: 21 }).tone).toBe('good')
  })
  it('daytime: over target → warn with delay nudge', () => {
    const n = pickNudge({ count: 10, goal: 'reduce', dailyTarget: 8, hour: 15 })
    expect(n.tone).toBe('warn')
  })
  it('daytime: reduce, nothing logged yet → info', () => {
    expect(pickNudge({ count: 0, goal: 'reduce', dailyTarget: 8, hour: 12 }).tone).toBe('info')
  })
  it('early morning with nothing yet → no nudge', () => {
    expect(pickNudge({ count: 0, goal: 'reduce', dailyTarget: 8, hour: 8 })).toBeNull()
  })
})

describe('dueReminderId', () => {
  const times = [{ id: 'a', time: '13:00', on: true }, { id: 'b', time: '20:30', on: false }]
  it('matches a toggled-on time', () => {
    expect(dueReminderId(times, new Date('2026-07-08T13:00:00'))).toBe('a')
  })
  it('ignores toggled-off times', () => {
    expect(dueReminderId(times, new Date('2026-07-08T20:30:00'))).toBeNull()
  })
  it('null when no match', () => {
    expect(dueReminderId(times, new Date('2026-07-08T14:15:00'))).toBeNull()
  })
})

describe('DEFAULT_REMINDERS', () => {
  it('are 4 meal anchors with valid times', () => {
    expect(DEFAULT_REMINDERS).toHaveLength(4)
    for (const r of DEFAULT_REMINDERS) expect(r.time).toMatch(/^\d\d:\d\d$/)
  })
})
