// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { TOUR_STEPS, isTourDone, markTourDone, requestTourReplay, shouldShowTour } from './tour'

beforeEach(() => localStorage.clear())

describe('TOUR_STEPS', () => {
  it('each step has a target, title, and body', () => {
    for (const s of TOUR_STEPS) {
      expect(s.target).toBeTruthy()
      expect(s.title).toBeTruthy()
      expect(s.body.length).toBeGreaterThan(10)
    }
  })
  it('targets are unique', () => {
    const t = TOUR_STEPS.map((s) => s.target)
    expect(new Set(t).size).toBe(t.length)
  })
})

describe('tour persistence', () => {
  it('a brand-new user should see the tour', () => {
    expect(isTourDone()).toBe(false)
    expect(shouldShowTour()).toBe(true)
  })
  it('after finishing, the tour is not shown again', () => {
    markTourDone()
    expect(isTourDone()).toBe(true)
    expect(shouldShowTour()).toBe(false)
  })
  it('replay re-enables the tour even after it was done', () => {
    markTourDone()
    requestTourReplay()
    expect(shouldShowTour()).toBe(true)
    expect(isTourDone()).toBe(false)
  })
  it('finishing after a replay clears the replay flag', () => {
    requestTourReplay()
    markTourDone()
    expect(shouldShowTour()).toBe(false)
  })
})
