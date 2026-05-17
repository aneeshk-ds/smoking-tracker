/**
 * StreakDisplay — shows the current streak count with a fire icon,
 * personal best, and shield indicator.
 */

export default function StreakDisplay({ streak, shieldAvailable = false }) {
  if (!streak || streak.mode === 'awareness') return null

  const count = streak.currentRun ?? streak.daysSinceLast ?? 0
  const best  = streak.bestRun ?? streak.personalBest ?? 0
  const isPersonalBest = count > 0 && count >= best && best > 1

  return (
    <div
      className="flex items-center justify-between px-5 py-4 rounded-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Left: flame + streak count */}
      <div className="flex items-center gap-3">
        <span style={{ fontSize: 28, lineHeight: 1 }}>🔥</span>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="streak-number" style={{ color: '#A78BFA' }}>
              {count}
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--muted)' }}
            >
              {count === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="text-xs font-normal mt-0.5" style={{ color: 'var(--dim)' }}>
            {isPersonalBest ? 'personal best' : `best: ${best}d`}
          </div>
        </div>
      </div>

      {/* Right: shield or personal best badge */}
      <div className="flex flex-col items-end gap-1">
        {shieldAvailable && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(74,222,128,0.13)',
              color: '#4ADE80',
              border: '1px solid rgba(74,222,128,0.25)',
            }}
          >
            <span style={{ fontSize: 12 }}>🛡</span>
            Shield
          </div>
        )}
        {isPersonalBest && (
          <div
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(167,139,250,0.14)',
              color: '#A78BFA',
              border: '1px solid rgba(167,139,250,0.25)',
            }}
          >
            PB
          </div>
        )}
      </div>
    </div>
  )
}
