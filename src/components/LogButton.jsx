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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Log now</span>
        </>
      )}
    </button>
  )
}
