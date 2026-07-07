import { describe, it, expect } from 'vitest'
import { formatCurrency, currencySymbol, formatCount } from './format'

describe('formatCurrency (INR)', () => {
  it('prefixes the rupee symbol', () => {
    expect(formatCurrency(500, 'INR')).toBe('₹500')
  })
  it('uses Indian comma grouping for thousands', () => {
    expect(formatCurrency(12000, 'INR')).toBe('₹12,000')
    expect(formatCurrency(150000, 'INR')).toBe('₹1.5L')
  })
  it('compacts crores', () => {
    expect(formatCurrency(20000000, 'INR')).toBe('₹2.0Cr')
  })
  it('rounds fractional amounts', () => {
    expect(formatCurrency(499.6, 'INR')).toBe('₹500')
  })
})

describe('formatCurrency (non-INR)', () => {
  it('formats USD with its symbol', () => {
    const out = formatCurrency(1000, 'USD')
    expect(out).toContain('1,000')
    expect(out).toMatch(/\$/)
  })
})

describe('helpers', () => {
  it('currencySymbol falls back to the code', () => {
    expect(currencySymbol('INR')).toBe('₹')
    expect(currencySymbol('XYZ')).toBe('XYZ')
  })
  it('formatCount stringifies', () => {
    expect(formatCount(7)).toBe('7')
  })
})
