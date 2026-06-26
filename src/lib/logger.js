// Minimal client-side error logging / observability — no third-party telemetry.
// Keeps a rolling buffer + per-context counts so failures are visible and
// inspectable in the console via window.__stLogs. Privacy-preserving (on-device).
const MAX = 50
const buffer = []
const counts = {}

export function logError(context, error) {
  const entry = {
    at: new Date().toISOString(),
    context,
    message: error?.message || String(error),
  }
  buffer.push(entry)
  if (buffer.length > MAX) buffer.shift()
  counts[context] = (counts[context] || 0) + 1
  console.error(`[st:${context}]`, entry.message)
  if (typeof window !== 'undefined') window.__stLogs = { errors: buffer, counts }
}

export function getErrorStats() {
  return { errors: [...buffer], counts: { ...counts } }
}
