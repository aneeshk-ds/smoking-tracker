/**
 * BreathingOrb — the centrepiece of the Home page.
 *
 * Displays today's cigarette count inside a slowly pulsing orb.
 * The ring around it changes colour based on today's status:
 *   - on-target  → amber glow
 *   - over-target → danger glow
 *   - no goal    → indigo glow (neutral/awareness)
 */

export default function BreathingOrb({ count, status = 'neutral', goal = 'awareness', dailyTarget = null }) {
  // status: 'good' | 'warning' | 'neutral'
  const ringColor =
    status === 'good'    ? '#A78BFA' :  // violet — on track
    status === 'warning' ? '#F87171' :  // red — over target
    '#6366F1'                           // indigo — neutral/awareness

  const ringGlow =
    status === 'good'    ? 'rgba(167,139,250,0.28)' :
    status === 'warning' ? 'rgba(248,113,113,0.22)' :
    'rgba(99,102,241,0.22)'

  return (
    <div className="flex flex-col items-center">
      {/* Outer ambient glow */}
      <div
        className="relative flex items-center justify-center rounded-full animate-breathe-glow"
        style={{
          width: 220,
          height: 220,
          background: `radial-gradient(ellipse at center, ${ringGlow} 0%, transparent 70%)`,
        }}
      >
        {/* Ring border */}
        <div
          className="absolute inset-0 rounded-full animate-breathe"
          style={{
            border: `2.5px solid ${ringColor}`,
            opacity: 0.75,
          }}
        />

        {/* Orb body */}
        <div
          className="relative flex flex-col items-center justify-center rounded-full animate-breathe"
          style={{
            width: 188,
            height: 188,
            background: 'linear-gradient(145deg, #1E3A6E 0%, #2D1B69 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Count */}
          <span className="stat-number" style={{ color: '#EEF2F7' }}>
            {count}
          </span>
          {/* Label */}
          <span
            className="text-sm font-normal mt-1 tracking-wide"
            style={{ color: 'rgba(238,242,247,0.55)' }}
          >
            {count === 1 ? 'cigarette' : 'cigarettes'}
          </span>
        </div>
      </div>

      {/* Status label */}
      <div className="mt-3 text-xs font-medium tracking-wide" style={{ color: ringColor }}>
        {status === 'good' && goal === 'quit'    && 'smoke-free today'}
        {status === 'good' && goal === 'reduce'  && `on track today${dailyTarget ? ` (within ${dailyTarget}/day)` : ''}`}
        {status === 'warning' && goal === 'quit'   && 'smoked today'}
        {status === 'warning' && goal === 'reduce' && `over your limit today${dailyTarget ? ` (>${dailyTarget})` : ''}`}
        {status === 'neutral'                    && 'today'}
      </div>
    </div>
  )
}
