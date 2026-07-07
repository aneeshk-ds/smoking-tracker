import { useEffect, useState } from 'react'
import { checkForUpdate } from '../lib/updater'

// Watches for a newly deployed build. If the user is actively in the app, a
// small "Refresh" toast appears (one tap = normal reload). If they leave and
// come back, it refreshes automatically — no hard-refresh ever needed.
export default function UpdateToast() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    const poll = async () => {
      if (active && (await checkForUpdate())) setReady(true)
    }

    // On returning to the tab, apply the update seamlessly.
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return
      if (await checkForUpdate()) window.location.reload()
    }

    poll()
    const id = setInterval(poll, 60_000)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!ready) return null

  return (
    <div
      style={{
        position: 'fixed', left: 16, right: 16,
        bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        zIndex: 1500, display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12,
          maxWidth: 380, width: '100%',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '10px 14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
          fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
        }}
      >
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>
          A new version is available.
        </span>
        <button
          onClick={() => window.location.reload()}
          style={{
            fontSize: 13, fontWeight: 600, color: 'var(--bg)', background: 'var(--accent)',
            border: 'none', borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
