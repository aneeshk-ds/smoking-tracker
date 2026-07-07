import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { TOUR_STEPS, markTourDone } from '../lib/tour'

const PAD = 8 // spotlight padding around the target

export default function Tour({ onClose }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)

  const steps = TOUR_STEPS
  const step = steps[i]

  const measure = useCallback(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (!el) { setRect(null); return null }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    return r
  }, [step.target])

  useLayoutEffect(() => { measure() }, [measure])

  useEffect(() => {
    // Re-measure shortly after (scrollIntoView is async) and on resize/scroll.
    const t = setTimeout(measure, 260)
    const on = () => measure()
    window.addEventListener('resize', on)
    window.addEventListener('scroll', on, true)
    return () => { clearTimeout(t); window.removeEventListener('resize', on); window.removeEventListener('scroll', on, true) }
  }, [measure])

  const finish = useCallback(() => { markTourDone(); onClose?.() }, [onClose])
  const next = useCallback(() => { i >= steps.length - 1 ? finish() : setI((n) => n + 1) }, [i, steps.length, finish])
  const back = useCallback(() => setI((n) => Math.max(0, n - 1)), [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next()
      else if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish, next, back])

  // Spotlight geometry (falls back to a centred card if target is missing).
  const vw = window.innerWidth
  const vh = window.innerHeight
  const sp = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  // Card placement: below the spotlight if room, else above; clamp horizontally.
  const CARD_W = Math.min(320, vw - 32)
  let cardTop, cardLeft
  if (sp) {
    const below = sp.top + sp.height + 12
    const roomBelow = vh - (sp.top + sp.height)
    cardTop = roomBelow > 200 ? below : Math.max(16, sp.top - 12 - 190)
    cardLeft = Math.max(16, Math.min(sp.left + sp.width / 2 - CARD_W / 2, vw - CARD_W - 16))
  } else {
    cardTop = vh / 2 - 90
    cardLeft = vw / 2 - CARD_W / 2
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
      {/* Backdrop with spotlight cutout. Tap backdrop = next. */}
      <div
        onClick={next}
        style={{
          position: 'fixed', inset: 0,
          background: sp ? 'transparent' : 'rgba(0,0,0,0.72)',
          cursor: 'pointer',
        }}
      />
      {sp && (
        <div
          onClick={next}
          style={{
            position: 'fixed',
            top: sp.top, left: sp.left, width: sp.width, height: sp.height,
            borderRadius: 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.72)',
            outline: '2px solid var(--accent)',
            transition: 'all 0.25s ease',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Coach card */}
      <div
        style={{
          position: 'fixed', top: cardTop, left: cardLeft, width: CARD_W,
          background: 'var(--surface-2)', color: 'var(--text)',
          border: '1px solid var(--border)', borderRadius: 16,
          padding: '16px 18px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
          textAlign: 'left', zIndex: 2001,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{step.title}</span>
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>{i + 1} / {steps.length}</span>
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--muted)', margin: '0 0 14px' }}>{step.body}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={finish}
            style={{ fontSize: 12, color: 'var(--dim)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}
          >
            Skip
          </button>
          <div style={{ flex: 1 }} />
          {i > 0 && (
            <button
              onClick={back}
              style={{ fontSize: 13, color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', padding: '8px 14px' }}
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--bg)', background: 'var(--accent)', border: 'none', borderRadius: 10, cursor: 'pointer', padding: '8px 16px' }}
          >
            {i >= steps.length - 1 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
