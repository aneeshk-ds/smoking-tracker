// Detects when a newer build has been deployed so the app can refresh into it,
// removing the need to hard-reload after every deploy.

const CURRENT = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'

export function currentBuildId() {
  return CURRENT
}

// Pure comparison — unit tested. Never flags in dev, or on missing/equal ids.
export function hasNewVersion(currentId, remoteId) {
  if (!currentId || currentId === 'dev') return false
  if (!remoteId) return false
  return remoteId !== currentId
}

export async function fetchRemoteBuildId() {
  try {
    const base = import.meta.env.BASE_URL || '/'
    const res = await fetch(`${base}version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data?.buildId ?? null
  } catch {
    return null
  }
}

export async function checkForUpdate() {
  return hasNewVersion(CURRENT, await fetchRemoteBuildId())
}
