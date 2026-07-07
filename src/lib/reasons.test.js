import { describe, it, expect } from 'vitest'
import { getReasons, reasonLabels, reasonPhrases, hasReasons } from './reasons'

describe('getReasons', () => {
  it('returns empty for no settings', () => {
    expect(getReasons(null)).toEqual({ keys: [], custom: '' })
  })
  it('reads the multi-select array', () => {
    expect(getReasons({ quitReasons: ['family', 'health'] }).keys).toEqual(['family', 'health'])
  })
  it('is backward-compatible with the legacy single field', () => {
    expect(getReasons({ quitReason: 'money' }).keys).toEqual(['money'])
  })
  it('trims the custom reason', () => {
    expect(getReasons({ quitReasonCustom: '  my dog  ' }).custom).toBe('my dog')
  })
})

describe('reasonLabels / reasonPhrases', () => {
  it('maps preset keys to labels and appends custom', () => {
    const s = { quitReasons: ['family', 'money'], quitReasonCustom: 'my dog' }
    expect(reasonLabels(s)).toEqual(['My family', 'Save money', 'my dog'])
  })
  it('maps preset keys to natural phrases', () => {
    expect(reasonPhrases({ quitReasons: ['health'] })).toEqual(['for your health'])
  })
  it('ignores unknown keys', () => {
    expect(reasonLabels({ quitReasons: ['bogus'] })).toEqual([])
  })
})

describe('hasReasons', () => {
  it('true when a preset is set', () => {
    expect(hasReasons({ quitReasons: ['family'] })).toBe(true)
  })
  it('true when only a custom reason is set', () => {
    expect(hasReasons({ quitReasonCustom: 'x' })).toBe(true)
  })
  it('false when nothing is set', () => {
    expect(hasReasons({})).toBe(false)
  })
})
