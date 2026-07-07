import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import { initTheme } from './lib/theme'
import App from './App.jsx'

initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Register service worker in production only
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // If a new service worker takes control (a fresh deploy), reload once so the
  // page runs the new assets. Guarded to avoid the first-install reload loop.
  let refreshing = false
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      // Periodically ask the browser to check for an updated service worker.
      setInterval(() => reg.update().catch(() => {}), 60_000)
    }).catch(() => {})
  })
}
