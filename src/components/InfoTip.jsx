import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

// Small ⓘ help affordance. Shows a plain-language popover on hover (desktop)
// and on tap (mobile). Closes on outside tap, scroll, resize, or Esc.
// Usage: <InfoTip text="What this means…" label="Streak" />
export default function InfoTip({ text, label, size = 15, className = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, placement: 'bottom' })
  const btnRef = useRef(null)
  const popRef = useRef(null)

  const place = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const W = Math.min(250, vw - 24)
    const margin = 8
    let left = r.left + r.width / 2 - W / 2
    left = Math.max(margin, Math.min(left, vw - W - margin))
    // Prefer below; flip above if not enough room.
    const spaceBelow = vh - r.bottom
    const placement = spaceBelow < 130 && r.top > 130 ? 'top' : 'bottom'
    const top = placement === 'bottom' ? r.bottom + 8 : r.top - 8
    setPos({ top, left, width: W, placement })
  }, [])

  const toggle = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen((o) => {
      const next = !o
      if (next) requestAnimationFrame(place)
      return next
    })
  }, [place])

  const show = useCallback(() => { place(); setOpen(true) }, [place])
  const hide = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (popRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span
      className={`inline-flex items-center align-middle ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label={label ? `Help: ${label}` : 'More info'}
        aria-expanded={open}
        className="inline-flex items-center justify-center rounded-full transition-colors"
        style={{
          width: size, height: size, minWidth: size,
          fontSize: Math.round(size * 0.66),
          fontStyle: 'italic',
          fontWeight: 700,
          lineHeight: 1,
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: open ? 'var(--bg)' : 'var(--muted)',
          background: open ? 'var(--accent)' : 'var(--surface-2)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
        }}
      >
        i
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          role="tooltip"
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: pos.placement === 'bottom' ? pos.top : undefined,
            bottom: pos.placement === 'top' ? window.innerHeight - pos.top : undefined,
            left: pos.left,
            width: pos.width,
            zIndex: 1000,
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '10px 12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
            fontSize: 12.5,
            lineHeight: 1.45,
            fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
            textAlign: 'left',
            fontWeight: 400,
          }}
        >
          {label && (
            <div style={{ fontWeight: 700, marginBottom: 3, color: 'var(--text)' }}>{label}</div>
          )}
          <div style={{ color: 'var(--muted)' }}>{text}</div>
        </div>,
        document.body
      )}
    </span>
  )
}
