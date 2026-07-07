// Tracker Service Worker — minimal offline shell cache.
// Base-aware: works whether served from "/" (local) or "/smoking-tracker/" (GH Pages).
const CACHE = 'tracker-v4'

// The SW lives at <base>sw.js, so its directory IS the app base.
const BASE = self.location.pathname.replace(/sw\.js$/, '') // e.g. "/smoking-tracker/"
const SHELL = BASE + 'index.html'

// On install: cache the SPA shell
self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([BASE, SHELL]))
  )
})

// On activate: clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: SPA fallback for navigations, cache-first for same-origin assets
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // Never cache the version marker — it must always report the live build.
  if (url.pathname.endsWith('/version.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(
        () => new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    )
    return
  }

  // Navigation requests → always fetch the freshest index.html when online
  // (bypass the HTTP cache so new deploys load), fall back to cached shell offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(SHELL))
    )
    return
  }

  // Same-origin static assets → cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached
        return fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, clone))
          }
          return res
        })
      })
    )
  }
})
