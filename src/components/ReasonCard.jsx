// Shows the user's saved "why I'm quitting" reason as a daily motivator.
const REASON_PHRASE = {
  family:  'for your family',
  health:  'for your health',
  partner: 'for your partner',
  child:   'for your child',
  money:   'to save money',
  fitness: 'for your fitness',
  control: 'to feel in control',
  doctor:  "on doctor's advice",
}

export default function ReasonCard({ quitReason }) {
  const phrase = quitReason ? REASON_PHRASE[quitReason] : null
  if (!phrase) return null

  return (
    <div
      className="card px-5 py-4 flex items-start gap-3"
      style={{ borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}
    >
      <span
        aria-hidden="true"
        className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: 'var(--accent)' }}
      />
      <div>
        <div
          className="text-[10px] font-sans font-medium tracking-widest uppercase mb-1"
          style={{ color: 'var(--accent)' }}
        >
          Your reason
        </div>
        <div className="font-display text-lg leading-snug" style={{ color: 'var(--text)' }}>
          You're doing this {phrase}.
        </div>
      </div>
    </div>
  )
}
