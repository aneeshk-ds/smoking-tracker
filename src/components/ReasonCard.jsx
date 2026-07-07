// Shows the user's saved "why I'm quitting" reasons as a daily motivator.
// Highlights each selected reason (presets + custom) so it stays front-of-mind.
import { reasonLabels } from '../lib/reasons'

export default function ReasonCard({ settings }) {
  const labels = reasonLabels(settings)
  if (!labels.length) return null

  return (
    <div className="card px-5 py-4" style={{ borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}>
      <div className="text-[10px] font-sans font-medium tracking-widest uppercase mb-2.5" style={{ color: 'var(--accent)' }}>
        {labels.length > 1 ? "Why you're doing this" : 'Your reason'}
      </div>
      <div className="flex flex-wrap gap-2">
        {labels.map((l, i) => (
          <span
            key={i}
            className="px-3 py-1.5 rounded-xl text-sm font-sans font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}
