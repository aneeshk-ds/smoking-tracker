// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateShareCard, renderShareCardBlob } from './share-card'

const meta = {
  month: 'July 2026', totalSmoked: 42, avgPerDay: 1.4,
  totalSpent: 1200, currency: 'INR', streak: 3, goal: 'reduce',
}

// Install a fake canvas so getContext/toBlob work under jsdom (which has no 2D ctx).
function installFakeCanvas() {
  const ctx = new Proxy({}, {
    get: (_t, prop) => {
      if (prop === 'measureText') return () => ({ width: 100 })
      return () => {}
    },
    set: () => true,
  })
  const realCreate = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'canvas') {
      return {
        width: 0, height: 0,
        getContext: () => ctx,
        toBlob: (cb) => cb(new Blob(['x'], { type: 'image/png' })),
      }
    }
    return realCreate(tag)
  })
}

beforeEach(() => {
  installFakeCanvas()
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:fake')
  globalThis.URL.revokeObjectURL = vi.fn()
})
afterEach(() => vi.restoreAllMocks())

describe('renderShareCardBlob', () => {
  it('produces a PNG blob', async () => {
    const blob = await renderShareCardBlob(meta)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })
})

describe('generateShareCard delivery', () => {
  it('uses the native share sheet when file sharing is supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    navigator.canShare = vi.fn(() => true)
    navigator.share = share
    const result = await generateShareCard(meta)
    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
    const arg = share.mock.calls[0][0]
    expect(arg.files[0]).toBeInstanceOf(File)
    expect(arg.files[0].type).toBe('image/png')
  })

  it('falls back to download when file sharing is unavailable', async () => {
    navigator.canShare = vi.fn(() => false)
    navigator.share = vi.fn()
    const clicks = []
    const realCreate = document.createElement.getMockImplementation()
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return { href: '', download: '', click: () => clicks.push(true) }
      return realCreate(tag)
    })
    const result = await generateShareCard(meta)
    expect(result).toBe('downloaded')
    expect(navigator.share).not.toHaveBeenCalled()
    expect(clicks.length).toBe(1)
  })

  it('treats a user-cancelled share (AbortError) as handled, not a crash', async () => {
    navigator.canShare = vi.fn(() => true)
    const err = new Error('cancelled'); err.name = 'AbortError'
    navigator.share = vi.fn().mockRejectedValue(err)
    const result = await generateShareCard(meta)
    expect(result).toBe('shared')
  })
})
