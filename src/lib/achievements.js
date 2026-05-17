import { subDays, format } from 'date-fns'

// ── Badge definitions ─────────────────────────────────────────────────────────
// Each badge unlocks when its condition returns true from computed stats.

export const BADGES = [
  {
    id: 'first_log',
    label: 'Day One',
    desc: 'Started tracking',
    icon: '🌱',
    condition: (s) => s.totalDaysLogged >= 1,
  },
  {
    id: 'week_logged',
    label: '7 Days',
    desc: 'One week on the app',
    icon: '📅',
    condition: (s) => s.totalDaysLogged >= 7,
  },
  {
    id: 'streak_3',
    label: '3-Day Run',
    desc: '3 consecutive days on target',
    icon: '🔥',
    condition: (s) => s.bestStreak >= 3,
  },
  {
    id: 'streak_7',
    label: 'Week Streak',
    desc: '7 days straight on target',
    icon: '⚡',
    condition: (s) => s.bestStreak >= 7,
  },
  {
    id: 'streak_14',
    label: '2 Weeks',
    desc: '14 days straight on target',
    icon: '🌊',
    condition: (s) => s.bestStreak >= 14,
  },
  {
    id: 'streak_21',
    label: '21 Days',
    desc: 'Habit territory — 3 weeks',
    icon: '🧠',
    condition: (s) => s.bestStreak >= 21,
  },
  {
    id: 'streak_30',
    label: 'Month One',
    desc: '30 days on target',
    icon: '🏆',
    condition: (s) => s.bestStreak >= 30,
  },
  {
    id: 'streak_50',
    label: '50 Days',
    desc: 'Halfway to 100',
    icon: '💎',
    condition: (s) => s.bestStreak >= 50,
  },
  {
    id: 'streak_100',
    label: '100 Days',
    desc: '100 days strong',
    icon: '🌟',
    condition: (s) => s.bestStreak >= 100,
  },
  {
    id: 'craving_5',
    label: 'Held Strong',
    desc: 'Logged 5 craving moments',
    icon: '🛡️',
    condition: (s) => s.cravingsLogged >= 5,
  },
  {
    id: 'triggers_10',
    label: 'Self-Aware',
    desc: 'Tagged a trigger 10 times',
    icon: '🔍',
    condition: (s) => s.triggersLogged >= 10,
  },
]

// ── Compute badge stats from raw cigarette + dayStats data ────────────────────

function dateStr(d) {
  return format(d, 'yyyy-MM-dd')
}

export function computeAchievementStats(allCigarettes, allDayStats, settings) {
  const goal = settings?.goal ?? 'awareness'
  const dailyTarget = settings?.dailyTarget ?? null

  // Days that count as "on target"
  function isOnTarget(stat) {
    if (goal === 'quit') return stat.count === 0
    if (goal === 'reduce' && dailyTarget !== null) return stat.count <= dailyTarget
    return true // awareness — every day counts
  }

  // Sort day stats chronologically
  const sorted = [...allDayStats].sort((a, b) => a.date.localeCompare(b.date))

  let bestStreak = 0
  let currentStreak = 0
  const today = dateStr(new Date())

  for (const stat of sorted) {
    if (isOnTarget(stat)) {
      currentStreak++
      if (currentStreak > bestStreak) bestStreak = currentStreak
    } else {
      currentStreak = 0
    }
  }

  // If today has no stat yet, don't break the streak (grace for early in the day)
  const todayStat = allDayStats.find((s) => s.date === today)
  if (!todayStat && currentStreak > 0) {
    // streak is intact — today just hasn't been logged yet
  }

  const totalDaysLogged = allDayStats.length
  const cravingsLogged = allCigarettes.filter((c) => c.craving !== null && c.craving !== undefined).length
  const triggersLogged = allCigarettes.filter((c) => c.trigger !== null && c.trigger !== undefined).length

  // Weekly XP: on-target days = 10pts each, cravings logged = 5pts each
  const weekStart = subDays(new Date(), 6)
  const weekStartStr = dateStr(weekStart)
  const weekStats = allDayStats.filter((s) => s.date >= weekStartStr)
  const weekXP = weekStats.reduce((acc, s) => acc + (isOnTarget(s) ? 10 : 0), 0)
    + allCigarettes
        .filter((c) => {
          const d = dateStr(new Date(c.timestamp))
          return d >= weekStartStr && c.craving !== null
        })
        .length * 5

  return {
    bestStreak,
    currentStreak,
    totalDaysLogged,
    cravingsLogged,
    triggersLogged,
    weekXP,
  }
}

// ── Evaluate which badges are unlocked ────────────────────────────────────────

export function computeUnlockedBadges(stats) {
  return BADGES.map((badge) => ({
    ...badge,
    unlocked: badge.condition(stats),
  }))
}

// ── Streak shield: 1 grace day available per 7-day window ────────────────────
// A shield is "available" if the user has 6+ on-target days in the last 7
// and hasn't used a shield slip in the last 7 days.

export function computeShieldStatus(allDayStats, settings) {
  const goal = settings?.goal ?? 'awareness'
  const dailyTarget = settings?.dailyTarget ?? null

  function isOnTarget(stat) {
    if (goal === 'quit') return stat.count === 0
    if (goal === 'reduce' && dailyTarget !== null) return stat.count <= dailyTarget
    return true
  }

  const last7 = []
  for (let i = 0; i < 7; i++) {
    const d = dateStr(subDays(new Date(), i))
    const stat = allDayStats.find((s) => s.date === d)
    last7.push(stat)
  }

  const onTargetCount = last7.filter((s) => s && isOnTarget(s)).length
  const slipCount = last7.filter((s) => s && !isOnTarget(s)).length

  return {
    available: onTargetCount >= 5 && slipCount <= 1,
    onTargetLast7: onTargetCount,
  }
}

// ── Calendar grid: last N weeks of performance ────────────────────────────────

export function buildCalendarGrid(allDayStats, settings, weeks = 12) {
  const goal = settings?.goal ?? 'awareness'
  const dailyTarget = settings?.dailyTarget ?? null

  function getStatus(stat) {
    if (!stat) return 'empty'
    if (goal === 'quit') return stat.count === 0 ? 'success' : 'danger'
    if (goal === 'reduce' && dailyTarget !== null) {
      if (stat.count === 0) return 'success'
      if (stat.count <= dailyTarget) return 'success'
      if (stat.count <= dailyTarget + 2) return 'warning'
      return 'danger'
    }
    // awareness — show relative intensity
    return stat.count > 0 ? 'logged' : 'empty'
  }

  const statsMap = {}
  for (const s of allDayStats) {
    statsMap[s.date] = s
  }

  const today = new Date()
  const grid = []

  for (let w = weeks - 1; w >= 0; w--) {
    const week = []
    for (let d = 6; d >= 0; d--) {
      const date = subDays(today, w * 7 + d)
      const ds = dateStr(date)
      const isFuture = date > today
      week.push({
        date: ds,
        status: isFuture ? 'future' : getStatus(statsMap[ds]),
        count: statsMap[ds]?.count ?? null,
      })
    }
    grid.push(week)
  }

  return grid
}
