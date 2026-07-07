import { describe, it, expect } from 'vitest'
import { findBrand, costPerCigarette, INDIAN_BRANDS } from './brands'

const sample = [
  { name: 'A', packPrice: 360, perPack: 20, singlePrice: 20 },
  { name: 'B', packPrice: 200, perPack: 10, singlePrice: 22 },
]

describe('findBrand', () => {
  it('finds by name', () => {
    expect(findBrand(sample, 'B').perPack).toBe(10)
  })
  it('returns null when missing', () => {
    expect(findBrand(sample, 'Z')).toBeNull()
  })
  it('is safe on undefined list', () => {
    expect(findBrand(undefined, 'A')).toBeNull()
  })
})

describe('costPerCigarette', () => {
  it('divides pack price by pack size', () => {
    expect(costPerCigarette(sample[0], 'pack')).toBe(18)
  })
  it('uses single price for singles', () => {
    expect(costPerCigarette(sample[0], 'single')).toBe(20)
  })
  it('returns 0 for a null brand', () => {
    expect(costPerCigarette(null)).toBe(0)
  })
})

describe('INDIAN_BRANDS seed', () => {
  it('has entries with required fields', () => {
    expect(INDIAN_BRANDS.length).toBeGreaterThan(0)
    for (const b of INDIAN_BRANDS) {
      expect(b.name).toBeTruthy()
      expect(b.perPack).toBeGreaterThan(0)
    }
  })
})
