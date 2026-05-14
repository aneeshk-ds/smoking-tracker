// Momentum-first streak display for the Home screen StatBlock

function MomentumBar({ current, best }) {
  if (!best || best === 0) return null
  const pct = Math.min(100, Math.round((current / best) * 100))
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct >= 100 ? 'var(--accent)' : 'var(--accent)',
            opacity: pct >= 100 ? 1 : 0.6,
          }}
        />
      </div>
      <span className="text-[9px] font-mono" style={{ color: 'var(--dim)' }}>
        {pct}%
      </span>
    </div>
  )
}

export default function HonestStreakDisplay({ streak }) {
  if (!streak || streak.mode === 'awareness') {
    return <span className="text-sm font-mono" style={{ color: 'var(--dim)' }}>tracking</span>
  }

  if (streak.mode === 'reducing') {
    const { currentRun, bestRun, nudge, isOnTrackToday } = streak
    const paused = isOnTrackToday === false

    return (
      <div>
        <span
          className="text-sm font-mono"
          style={{ color: paused ? 'var(--muted)' : 'var(--text)' }}
        >
          {streak.homeLabel}
        </span>
        {!paused && currentRun > 0 && bestRun > 1 && (
          <MomentumBar current={currentRun} best={bestRun} />
        )}
        <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--dim)' }}>
          {nudge}
        </div>
      </div>
    )
  }

  if (streak.mode === 'quitting') {
    const { daysSinceLast, personalBest, nudge, isCleanToday } = streak
    const paused = !isCleanToday

    return (
      <div>
        <span
          className="text-sm font-mono"
          style={{ color: paused ? 'var(--muted)' : 'var(--text)' }}
        >
          {streak.homeLabel}
        </span>
        {!paused && daysSinceLast > 0 && personalBest > 1 && (
          <MomentumBar current={daysSinceLast} best={personalBest} />
        )}
        <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--dim)' }}>
          {nudge}
        </div>
      </div>
    )
  }

  return null
}
