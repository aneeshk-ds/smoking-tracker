/**
 * AchievementBadge — single badge tile used in the Journey page.
 * Locked badges are shown greyed-out.
 */

export default function AchievementBadge({ badge, size = 'md', animate = false }) {
  const isLg = size === 'lg'
  const dim  = isLg ? 80 : 64

  return (
    <div
      className={`flex flex-col items-center gap-2 ${animate ? 'animate-badge-pop' : ''}`}
      style={{ width: dim + 16 }}
    >
      {/* Icon circle */}
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: dim,
          height: dim,
          background: badge.unlocked
            ? 'linear-gradient(145deg, #1E3A6E 0%, #2D1B69 100%)'
            : 'var(--surface-2)',
          border: badge.unlocked
            ? '1.5px solid rgba(232,168,56,0.4)'
            : '1.5px solid var(--border)',
          opacity: badge.unlocked ? 1 : 0.45,
          boxShadow: badge.unlocked
            ? '0 4px 20px rgba(99,102,241,0.2)'
            : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <span style={{ fontSize: isLg ? 32 : 26, lineHeight: 1, filter: badge.unlocked ? 'none' : 'grayscale(1)' }}>
          {badge.icon}
        </span>
      </div>

      {/* Label */}
      <span
        className="text-xs font-semibold text-center leading-tight"
        style={{
          color: badge.unlocked ? 'var(--text)' : 'var(--dim)',
          maxWidth: dim + 8,
        }}
      >
        {badge.label}
      </span>
    </div>
  )
}
