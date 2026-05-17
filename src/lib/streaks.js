import { format, subDays } from 'date-fns'

function dateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

export function computeHonestStreak(allStats, settings) {
  const goal = settings?.goal ?? 'awareness'
  const dailyTarget = settings?.dailyTarget ?? null

  if (goal === 'awareness') {
    return { mode: 'awareness', displayText: null }
  }

  const statsMap = {}
  for (const s of allStats) {
    statsMap[s.date] = s
  }

  const today = new Date()
  const todayStr = dateStr(today)

  // ── REDUCE mode ──
  if (goal === 'reduce' && dailyTarget !== null) {
    const todayStat = statsMap[todayStr]
    const isOnTrackToday = todayStat ? todayStat.count <= dailyTarget : null

    // Current consecutive run of under-target days (backwards from today)
    let currentRun = 0
    for (let i = 0; i < 365; i++) {
      const d = dateStr(subDays(today, i))
      const stat = statsMap[d]
      if (!stat) break
      if (stat.count <= dailyTarget) currentRun++
      else break
    }

    // Personal best consecutive run
    const sortedDates = Object.keys(statsMap).sort()
    let bestRun = 0
    let run = 0
    for (const date of sortedDates) {
      if (statsMap[date].count <= dailyTarget) {
        run++
        if (run > bestRun) bestRun = run
      } else {
        run = 0
      }
    }
    bestRun = Math.max(bestRun, currentRun)

    // Slips in last 30 days
    let slipsInLast30 = 0
    for (let i = 0; i < 30; i++) {
      const d = dateStr(subDays(today, i))
      const stat = statsMap[d]
      if (stat && stat.count > dailyTarget) slipsInLast30++
    }

    // How long was the run before today's slip
    let previousRun = 0
    if (isOnTrackToday === false) {
      for (let i = 1; i < 365; i++) {
        const d = dateStr(subDays(today, i))
        const stat = statsMap[d]
        if (!stat) break
        if (stat.count <= dailyTarget) previousRun++
        else break
      }
    }

    // Nudge language
    let nudge
    if (isOnTrackToday === false) {
      nudge = previousRun > 0
        ? `${previousRun} good day${previousRun !== 1 ? 's' : ''} before this — that progress stands`
        : 'keep going — tomorrow is a fresh start'
    } else if (currentRun === 0) {
      nudge = 'start your run today'
    } else if (currentRun >= bestRun && bestRun > 1) {
      nudge = 'personal best — keep it going'
    } else {
      nudge = `best: ${bestRun} day${bestRun !== 1 ? 's' : ''}`
    }

    return {
      mode: 'reducing',
      currentRun,
      bestRun,
      daysReducing: sortedDates.filter((d) => statsMap[d]?.count <= dailyTarget).length,
      slipsInLast30,
      isOnTrackToday,
      nudge,
      homeLabel: currentRun > 0 ? `${currentRun}-day run` : 'keep going',
      displayText: currentRun > 0
        ? `${currentRun}-day run. ${nudge}.`
        : `${nudge}.`,
    }
  }

  // ── QUIT mode ──
  if (goal === 'quit') {
    const sorted = [...allStats].sort((a, b) => b.date.localeCompare(a.date))
    const lastSmoked = sorted.find((s) => s.count > 0)

    if (!lastSmoked) {
      const cleanDays = allStats.filter((s) => s.count === 0).length
      return {
        mode: 'quitting',
        daysSinceLast: null,
        personalBest: cleanDays,
        currentRun: cleanDays,
        isCleanToday: true,
        nudge: cleanDays > 0 ? `${cleanDays}-day run` : 'day one',
        homeLabel: cleanDays > 0 ? `${cleanDays}d free` : 'day one',
        displayText: cleanDays > 0
          ? `${cleanDays} days free. You're on a run.`
          : 'Day one. Every hour counts.',
      }
    }

    const lastDate = new Date(lastSmoked.date)
    const nowDate = new Date(todayStr)
    const daysSince = Math.floor((nowDate - lastDate) / (1000 * 60 * 60 * 24))
    const personalBest = computePersonalBest(allStats)
    const isCleanToday = !statsMap[todayStr] || statsMap[todayStr].count === 0

    // How many clean days immediately before today's slip
    let cleanBeforeSlip = 0
    if (!isCleanToday) {
      for (let i = 1; i < 365; i++) {
        const d = dateStr(subDays(today, i))
        const stat = statsMap[d]
        if (!stat || stat.count === 0) {
          if (!stat) break // no record = no data, stop counting
          cleanBeforeSlip++
        } else {
          break
        }
      }
    }

    let nudge
    if (!isCleanToday) {
      nudge = cleanBeforeSlip > 0
        ? `${cleanBeforeSlip} clean day${cleanBeforeSlip !== 1 ? 's' : ''} before this — one slip is data, not failure`
        : 'every hour without one counts — restart from here'
    } else if (daysSince >= personalBest && personalBest > 1) {
      nudge = 'personal best — you\'re doing it'
    } else if (daysSince > 0) {
      nudge = `personal best: ${personalBest} day${personalBest !== 1 ? 's' : ''}`
    } else {
      nudge = 'logged today — keep the streak alive'
    }

    const homeLabel = daysSince === 0
      ? (isCleanToday ? 'today clean' : 'keep going')
      : `${daysSince}d free`

    return {
      mode: 'quitting',
      daysSinceLast: daysSince,
      personalBest,
      currentRun: daysSince,
      isCleanToday,
      nudge,
      homeLabel,
      displayText: daysSince > 0
        ? `${daysSince} day${daysSince !== 1 ? 's' : ''} free. ${nudge}.`
        : `${nudge}.`,
    }
  }

  return { mode: 'awareness', displayText: null }
}

/**
 * computeSmokingStreak — consecutive days the user HAS smoked, backwards from today.
 * A non-zero result is a warning signal; zero means they're currently clean.
 */
export function computeSmokingStreak(allStats) {
  if (!allStats.length) return { currentRun: 0, longestRun: 0 }

  const statsMap = {}
  for (const s of allStats) statsMap[s.date] = s

  const today = new Date()

  // Walk backwards: count consecutive days with count > 0
  let currentRun = 0
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd')
    const stat = statsMap[d]
    if (!stat) break          // no record for this day — stop
    if (stat.count > 0) currentRun++
    else break                // clean day breaks the streak
  }

  // All-time longest smoking run
  const sorted = [...allStats].sort((a, b) => a.date.localeCompare(b.date))
  let longestRun = 0
  let run = 0
  for (const s of sorted) {
    if (s.count > 0) {
      run++
      if (run > longestRun) longestRun = run
    } else {
      run = 0
    }
  }
  longestRun = Math.max(longestRun, currentRun)

  return { currentRun, longestRun }
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
