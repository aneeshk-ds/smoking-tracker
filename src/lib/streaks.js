import { format, subDays } from 'date-fns'

function dateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

// Returns honest streak object.
// For reduce mode: { mode: 'reducing', daysReducing, slipsInLast30, displayText }
// For quit mode: { mode: 'quitting', timeSinceLast, personalBest, slips, displayText }
// For awareness mode: { mode: 'awareness', displayText: null }

export function computeHonestStreak(allStats, settings) {
  const goal = settings?.goal ?? 'awareness'
  const dailyTarget = settings?.dailyTarget ?? null

  if (goal === 'awareness') {
    return { mode: 'awareness', displayText: null }
  }

  // Build a map: date -> dayStats
  const statsMap = {}
  for (const s of allStats) {
    statsMap[s.date] = s
  }

  const today = new Date()

  if (goal === 'reduce' && dailyTarget !== null) {
    let daysReducing = 0
    let slipsInLast30 = 0

    for (let i = 0; i < 30; i++) {
      const d = dateStr(subDays(today, i))
      const stat = statsMap[d]
      if (!stat) continue // day not yet logged, skip
      if (stat.count <= dailyTarget) {
        daysReducing++
      } else {
        slipsInLast30++
      }
    }

    const slipText = slipsInLast30 === 1 ? '1 slip noted.' : `${slipsInLast30} slips noted.`
    const displayText =
      daysReducing === 0
        ? slipText
        : `${daysReducing} days reducing. ${slipText}`

    return {
      mode: 'reducing',
      daysReducing,
      slipsInLast30,
      displayText,
      homeLabel: `${daysReducing}d, ${slipsInLast30} slip${slipsInLast30 !== 1 ? 's' : ''}`,
    }
  }

  if (goal === 'quit') {
    // Find the most recent cigarette
    const sorted = [...allStats].sort((a, b) => b.date.localeCompare(a.date))
    const lastSmoked = sorted.find((s) => s.count > 0)

    if (!lastSmoked) {
      // Never smoked (in tracked data) or all days are zero
      const totalDaysTracked = allStats.filter((s) => s.count === 0).length
      return {
        mode: 'quitting',
        timeSinceLast: null,
        personalBest: totalDaysTracked,
        slips: 0,
        displayText: `${totalDaysTracked} days clean.`,
        homeLabel: `${totalDaysTracked}d clean`,
      }
    }

    const lastDate = new Date(lastSmoked.date)
    const nowDate = new Date(dateStr(today))
    const daysSince = Math.floor(
      (nowDate - lastDate) / (1000 * 60 * 60 * 24)
    )

    // Personal best: longest consecutive streak of zero-count days before last slip
    const personalBest = computePersonalBest(allStats)

    // Slips in last 30 days
    let slips = 0
    for (let i = 0; i < 30; i++) {
      const d = dateStr(subDays(today, i))
      const stat = statsMap[d]
      if (stat && stat.count > 0) slips++
    }

    const homeLabel =
      daysSince === 0 ? 'today' : `${daysSince}d since last`

    const displayText =
      daysSince > 0
        ? `${daysSince} day${daysSince !== 1 ? 's' : ''} since last cigarette. Your longest stretch: ${personalBest} days.`
        : `Logged today. Your longest stretch: ${personalBest} days.`

    return {
      mode: 'quitting',
      daysSinceLast: daysSince,
      personalBest,
      slips,
      displayText,
      homeLabel,
    }
  }

  return { mode: 'awareness', displayText: null }
}

function computePersonalBest(allStats) {
  if (!allStats.length) return 0
  const sorted = [...allStats].sort((a, b) => a.date.localeCompare(b.date))
  let best = 0
  let current = 0
  for (const s of sorted) {
    if (s.count === 0) {
      current++
      if (current > best) best = current
    } else {
      current = 0
    }
  }
  return best
}
