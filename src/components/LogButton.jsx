import { useRef, useState } from 'react'
import { logCigarette } from '../lib/storage'

// Single tap: quick log. Long press: navigate to /log for detailed entry.
export default function LogButton({ onLogged, onLongPress }) {
  const [pressing, setPressing] = useState(false)
  const [logging, setLogging] = useState(false)
  const timerRef = useRef(null)
  const didLongPress = useRef(false)

  function handleStart(e) {
    e.preventDefault()
    didLongPress.current = false
    setPressing(true)
    timerRef.current = setTimeout(() => {
      didLongPress.current = true
      setPressing(false)
      if (navigator.vibrate) navigator.vibrate(20)
      onLongPress?.()
    }, 500)
  }

  async function handleEnd(e) {
    e.preventDefault()
    clearTimeout(timerRef.current)
    setPressing(false)
    if (didLongPress.current) return

    if (logging) return
    setLogging(true)
    if (navigator.vibrate) navigator.vibrate(10)
    try {
      await logCigarette()
      onLogged?.()
    } finally {
      setLogging(false)
    }
  }

  function handleCancel() {
    clearTimeout(timerRef.current)
    setPressing(false)
  }

  return (
    <button
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleCancel}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      disabled={logging}
      style={{
        transform: pressing ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 100ms ease',
      }}
      className={`
        w-full py-4 rounded-2xl font-sans text-base font-medium tracking-wide
        flex items-center justify-center gap-2
        border-0 outline-none cursor-pointer select-none
        ${logging ? 'bg-accent/60 text-bg/60' : 'bg-accent text-bg'}
        active:bg-accent/90
      `}
    >
      {logging ? (
        <span className="font-mono text-sm">logged</span>
      ) : (
        <>
          {/* Cigarette icon — angled slightly, filter on right, ember + smoke on left */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Smoke wisps */}
            <path d="M5 9 Q4.2 7.5 5 6" strokeWidth="1.5" opacity="0.75" />
            <path d="M8 8.5 Q7.2 7 8 5.5" strokeWidth="1.5" opacity="0.5" />
            {/* Body */}
            <rect x="3" y="11" width="14" height="3.5" rx="1.75" fill="currentColor" opacity="0.15" />
            <rect x="3" y="11" width="14" height="3.5" rx="1.75" />
            {/* Filter */}
            <rect x="17" y="11" width="4" height="3.5" rx="1" fill="currentColor" opacity="0.4" />
            {/* Ember */}
            <circle cx="3.2" cy="12.75" r="1.1" fill="currentColor" />
          </svg>
          <span>Log a cigarette</span>
        </>
      )}
    </button>
  )
}
