import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the storage layer so we can observe what seedDemoData writes.
const logged = []
vi.mock('./storage', () => ({
  logCigarette: vi.fn(async (e) => { logged.push(e); return e }),
  getSettings: vi.fn(async () => ({
    defaultBrand: 'Gold Flake Kings',
    defaultPurchaseType: 'pack',
    brands: [{ name: 'Gold Flake Kings', packPrice: 360, perPack: 20, singlePrice: 20 }],
  })),
}))

import { seedDemoData } from './demo-seed'

describe('seedDemoData', () => {
  beforeEach(() => {
    logged.length = 0
    // Deterministic randomness → repeatable trend assertions.
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })
  afterEach(() => vi.restoreAllMocks())

  it('creates a non-trivial number of entries', async () => {
    const n = await seedDemoData(30)
    expect(n).toBeGreaterThan(50)
    expect(n).toBe(logged.length)
  })

  it('never seeds a future timestamp', async () => {
    await seedDemoData(30)
    const now = Date.now()
    for (const e of logged) expect(e.timestamp).toBeLessThanOrEqual(now)
  })

  it('stays within the requested window (30 days)', async () => {
    await seedDemoData(30)
    const now = Date.now()
    const floor = now - 31 * 24 * 60 * 60 * 1000
    for (const e of logged) expect(e.timestamp).toBeGreaterThanOrEqual(floor)
  })

  it('tags entries with brand + metadata used by the charts', async () => {
    await seedDemoData(7)
    for (const e of logged) {
      expect(e.brand).toBe('Gold Flake Kings')
      expect(e.purchaseType).toBe('pack')
      expect(typeof e.trigger).toBe('string')
      expect(typeof e.location).toBe('string')
      expect(e.craving).toBeGreaterThanOrEqual(1)
    }
  })

  it('trends downward: older days average more than recent days', async () => {
    await seedDemoData(28)
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const oldHalf = logged.filter((e) => e.timestamp < now - 14 * day).length
    const newHalf = logged.filter((e) => e.timestamp >= now - 14 * day).length
    expect(oldHalf).toBeGreaterThan(newHalf)
  })
})
