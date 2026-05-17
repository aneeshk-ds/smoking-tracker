/**
 * StreakDisplay — shows both streaks side by side:
 *   Left  (violet): consecutive smoke-free / on-target days
 *   Right (red):    consecutive days WITH any cigarettes (warning signal)
 */

export default function StreakDisplay({ streak, smokingStreak, shieldAvailable = false }) {
  const smokingRun    = smokingStreak?.currentRun ?? 0
  const hasGoalStreak = streak && streak.mode !== 'awareness'

  // If no data at all, render nothing
  if (!hasGoalStreak && smokingRun === 0) return null

  const cleanCount = hasGoalStreak
    ? (streak.currentRun ?? streak.daysSinceLast ?? 0)
    : 0
  const cleanBest = hasGoalStreak
    ? (streak.bestRun ?? streak.personalBest ?? 0)
    : 0
  const isPersonalBest = cleanCount > 0 && cleanCount >= cleanBest && cleanBest > 1

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* Two-column streak display */}
      <div className="flex">

        {/* Left: smoke-free / on-target streak */}
        <div
          className="flex-1 flex items-start gap-3 px-4 py-4"
          style={{ background: 'var(--surface)' }}
        >
          <span style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>🔥</span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="streak-number" style={{ color: '#A78BFA', fontSize: 28, fontWeight: 700 }}>
                {cleanCount}
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                {cleanCount === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="text-[10px] font-normal mt-0.5 leading-snug" style={{ color: 'var(--dim)' }}>
              {hasGoalStreak
                ? (streak.mode === 'quitting' ? 'smoke-free' : 'on target')
                : 'smoke-free days'}
            </div>
            <div className="text-[10px] font-normal mt-1" style={{ color: 'var(--dim)' }}>
              {isPersonalBest ? 'personal best' : `best: ${cleanBest}d`}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'var(--border)' }} />

        {/* Right: consecutive smoking days */}
        <div
          className="flex-1 flex items-start gap-3 px-4 py-4"
          style={{ background: smokingRun > 0 ? 'rgba(248,113,113,0.04)' : 'var(--surface)' }}
        >
          <span style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>🚬</span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span
                className="streak-number"
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: smokingRun > 0 ? '#F87171' : 'var(--dim)',
                }}
              >
                {smokingRun}
              </span>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                {smokingRun === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="text-[10px] font-normal mt-0.5 leading-snug" style={{ color: 'var(--dim)' }}>
              smoking in a row
            </div>
            <div className="text-[10px] font-normal mt-1" style={{ color: 'var(--dim)' }}>
              {smokingRun === 0
                ? 'none today'
                : smokingRun >= 3
                  ? 'consistent pattern'
                  : 'recent activity'}
            </div>
          </div>
        </div>
      </div>

      {/* Shield banner — shown below if active */}
      {shieldAvailable && (
        <div
          className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold"
          style={{
            background: 'rgba(74,222,128,0.08)',
            borderTop: '1px solid rgba(74,222,128,0.18)',
            color: '#4ADE80',
          }}
        >
          <span style={{ fontSize: 12 }}>🛡</span>
          Shield ready — streak protected for today
        </div>
      )}

      {/* Personal best banner */}
      {isPersonalBest && !shieldAvailable && (
        <div
          className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold"
          style={{
            background: 'rgba(167,139,250,0.07)',
            borderTop: '1px solid rgba(167,139,250,0.18)',
            color: '#A78BFA',
          }}
        >
          Personal best — keep going
        </div>
      )}
    </div>
  )
}
