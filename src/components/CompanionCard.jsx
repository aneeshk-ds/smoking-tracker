import { companionEmoji, companionMood, companionLine } from '../lib/companion'

const MOOD = {
  thriving:   { bg: 'rgba(0,229,160,0.08)',  border: 'rgba(0,229,160,0.4)',  tag: 'thriving' },
  ok:         { bg: 'var(--surface)',         border: 'var(--border)',         tag: 'with you' },
  struggling: { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.4)',  tag: 'holding on' },
}

// Shows the user's named companion, its mood, and a first-person line.
export default function CompanionCard({ companion, count, goal, dailyTarget, onTargetRate }) {
  if (!companion?.enabled) return null
  const mood = companionMood({ count, goal, dailyTarget, onTargetRate })
  const line = companionLine({ ...companion, mood, count, goal, dailyTarget })
  const m = MOOD[mood] || MOOD.ok
  const dim = mood === 'struggling'
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: m.bg, border: `1px solid ${m.border}` }}>
      <span style={{ fontSize: 30, opacity: dim ? 0.55 : 1, transition: 'opacity .3s' }}>{companionEmoji(companion.type)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{companion.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--dim)' }}>{m.tag}</span>
        </div>
        <p className="text-xs font-sans leading-snug mt-0.5" style={{ color: 'var(--muted)' }}>{line.replace(companion.name + ': ', '')}</p>
      </div>
    </div>
  )
}
