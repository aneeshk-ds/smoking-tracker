import { getAllCigarettes } from './storage'

const MIN_ENTRIES = 7

const WINDOW_LABELS = {
  morning: 'mornings (6–12)',
  afternoon: 'afternoons (12–5)',
  evening: 'evenings (5–9pm)',
  night: 'late nights',
}

function getTimeWindow(hour) {
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

function topEntry(map) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
  return entries.length > 0 ? entries[0] : null
}

/**
 * Derives 1–2 pattern insights from all logged entries.
 * Returns null if there are fewer than MIN_ENTRIES entries.
 *
 * Shape: { insights: Array<Insight>, totalEntries: number }
 * Insight: { type: 'trigger'|'time'|'location', label: string, value: string, detail: string }
 */
export async function getPatternInsights() {
  const all = await getAllCigarettes()
  if (all.length < MIN_ENTRIES) return null

  const windowCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  const triggerCounts = {}
  const locationCounts = {}
  let entriesWithTrigger = 0
  let entriesWithLocation = 0

  for (const entry of all) {
    const hour = new Date(entry.timestamp).getHours()
    windowCounts[getTimeWindow(hour)]++

    if (entry.trigger) {
      triggerCounts[entry.trigger] = (triggerCounts[entry.trigger] || 0) + 1
      entriesWithTrigger++
    }
    if (entry.location) {
      locationCounts[entry.location] = (locationCounts[entry.location] || 0) + 1
      entriesWithLocation++
    }
  }

  const insights = []

  // Top trigger — only surface if at least 3 entries have trigger data
  const topTrigger = topEntry(triggerCounts)
  if (topTrigger && topTrigger[1] >= 3) {
    const pct = Math.round((topTrigger[1] / all.length) * 100)
    insights.push({
      type: 'trigger',
      label: 'top trigger',
      value: topTrigger[0],
      detail: `${pct}% of logs`,
    })
  }

  // Peak time window — always computable from timestamp, no metadata required
  const topWindow = topEntry(windowCounts)
  if (topWindow && insights.length < 2) {
    const pct = Math.round((topWindow[1] / all.length) * 100)
    insights.push({
      type: 'time',
      label: 'peak window',
      value: WINDOW_LABELS[topWindow[0]],
      detail: `${pct}% of logs`,
    })
  }

  // Top location — fallback if still only 1 insight and trigger was sparse
  if (insights.length < 2) {
    const topLocation = topEntry(locationCounts)
    if (topLocation && topLocation[1] >= 3) {
      const pct = Math.round((topLocation[1] / all.length) * 100)
      insights.push({
        type: 'location',
        label: 'top location',
        value: topLocation[0],
        detail: `${pct}% of logs`,
      })
    }
  }

  return insights.length > 0
    ? { insights: insights.slice(0, 2), totalEntries: all.length }
    : null
}
