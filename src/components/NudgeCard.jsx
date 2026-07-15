// A gentle in-app nudge banner shown on Home based on today's state.
const TONE = {
  good: { bg: 'rgba(0,229,160,0.08)', border: 'rgba(0,229,160,0.4)' },
  info: { bg: 'var(--surface)',       border: 'var(--border)' },
  warn: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.4)' },
}
export default function NudgeCard({ nudge, onDismiss }) {
  if (!nudge) return null
  const t = TONE[nudge.tone] || TONE.info
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: t.bg, border: `1px solid ${t.border}` }}
    >
      <span className="text-sm font-sans leading-snug flex-1" style={{ color: 'var(--text)' }}>{nudge.text}</span>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" className="text-sm leading-none px-1" style={{ color: 'var(--dim)' }}>✕</button>
      )}
    </div>
  )
}
