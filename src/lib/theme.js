// App-wide theme: 'system' | 'light' | 'dark'. Stored locally; 'system' follows
// the OS. Applies data-theme on <html>, which drives the CSS variables in
// globals.css (and therefore every Tailwind color utility too).
const KEY = 'st_theme'

export function getThemePref() {
  try { return localStorage.getItem(KEY) || 'system' } catch { return 'system' }
}

export function resolveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'
}

export function applyTheme(pref) {
  const eff = resolveTheme(pref)
  document.documentElement.setAttribute('data-theme', eff)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', eff === 'light' ? '#F4F6FA' : '#0D1420')
}

export function setThemePref(pref) {
  try { localStorage.setItem(KEY, pref) } catch { /* ignore */ }
  applyTheme(pref)
}

let mq
export function initTheme() {
  applyTheme(getThemePref())
  if (window.matchMedia) {
    mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => { if (getThemePref() === 'system') applyTheme('system') }
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else if (mq.addListener) mq.addListener(handler)
  }
}
