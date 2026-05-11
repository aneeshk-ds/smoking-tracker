import { useEffect, useState } from 'react'

// Shows iOS "Add to Home Screen" instructions or an Android install button.
// Dismissed state is stored in localStorage so it only shows once.

export default function InstallBanner() {
  const [mode, setMode] = useState(null) // null | 'ios' | 'android'
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('installBannerDismissed')) {
      setDismissed(true)
      return
    }

    const isStandalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches

    if (isStandalone) { setDismissed(true); return }

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

    if (isIOS && isSafari) {
      setMode('ios')
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('installBannerDismissed', '1')
    setDismissed(true)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') dismiss()
    setDeferredPrompt(null)
  }

  if (dismissed || !mode) return null

  return (
    <div
      className="px-4 pt-3"
      style={{ maxWidth: 448, margin: '0 auto', width: '100%' }}
    >
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{
          backgroundColor: 'rgba(0,229,160,0.07)',
          border: '1px solid rgba(0,229,160,0.2)',
        }}
      >
        <div className="flex-1 min-w-0">
          {mode === 'ios' ? (
            <>
              <p className="text-text text-xs font-mono font-medium mb-0.5">Add to Home Screen</p>
              <p className="text-muted text-[10px] font-mono leading-relaxed">
                Tap <span className="text-accent">Share</span> then{' '}
                <span className="text-accent">Add to Home Screen</span> for the full app experience.
              </p>
            </>
          ) : (
            <>
              <p className="text-text text-xs font-mono font-medium mb-0.5">Install Tracker</p>
              <button
                onClick={install}
                className="text-accent text-[10px] font-mono"
              >
                Install app for offline use
              </button>
            </>
          )}
        </div>
        <button onClick={dismiss} className="text-dim text-xs font-mono flex-shrink-0 mt-0.5">
          ✕
        </button>
      </div>
    </div>
  )
}
