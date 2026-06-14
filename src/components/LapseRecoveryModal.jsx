import { useState } from 'react'
import { TRIGGERS } from '../lib/constants'
import { updateCigarette, getTodayEntries } from '../lib/storage'

const PROTECTIVE_ACTIONS = [
  'move away from where you smoked',
  'drink a full glass of water',
  'take a 5-minute walk',
  'call or message someone you trust',
  'set a timer — wait 10 minutes before the next one',
]

export default function LapseRecoveryModal({ previousRun, goal, quitReason, onClose }) {
  const [trigger, setTrigger] = useState('')
  const [saved, setSaved] = useState(false)

  const reasonPhrase = quitReason
    ? { family: 'for your family', health: 'for your health', partner: 'for your partner',
        child: 'for your child', money: 'to save money', fitness: 'for your fitness',
        control: 'to feel in control', doctor: 'on doctor\'s advice' }[quitReason] ?? null
    : null

  async function handleSave() {
    if (trigger) {
      // Save trigger to the most recent entry today
      try {
        const entries = await getTodayEntries()
        if (entries.length > 0) {
          await updateCigarette(entries[0].id, { trigger })
        }
      } catch (_) {}
    }
    setSaved(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full rounded-t-3xl px-6 pt-5 pb-10 max-h-[88vh] overflow-y-auto"
        style={{ background: 'var(--surface)' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />

        {!saved ? (
          <>
            {/* Header */}
            <div className="mb-5">
              <h2 className="font-display text-xl" style={{ color: 'var(--text)' }}>
                Rough moment.
              </h2>
              <p className="text-sm font-sans mt-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                {previousRun > 0
                  ? `${previousRun} good day${previousRun !== 1 ? 's' : ''} before this — that progress is still real.`
                  : 'One slip doesn\'t define the journey.'}
                {reasonPhrase ? ` You set out ${reasonPhrase}. That reason hasn't changed.` : ''}
              </p>
            </div>

            {/* What triggered it */}
            <div className="mb-5">
              <label className="text-xs font-sans block mb-2" style={{ color: 'var(--muted)' }}>
                What triggered it? (optional)
              </label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm font-sans border appearance-none"
                style={{
                  background: 'var(--surface-2)',
                  borderColor: trigger ? 'var(--accent)' : 'var(--border)',
                  color: trigger ? 'var(--text)' : 'var(--muted)',
                }}
              >
                <option value="">— select trigger —</option>
                {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Protective actions */}
            <div className="mb-6">
              <p className="text-xs font-sans mb-3" style={{ color: 'var(--muted)' }}>
                One of these in the next 10 minutes helps:
              </p>
              <div className="flex flex-col gap-2">
                {PROTECTIVE_ACTIONS.map((action) => (
                  <div
                    key={action}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)', opacity: 0.6 }} />
                    <span className="text-xs font-sans" style={{ color: 'var(--muted)' }}>{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-4 rounded-2xl font-sans font-medium text-base"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              Got it — protect the next few hours
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-2xl font-display mb-3" style={{ color: 'var(--text)' }}>
              Good.
            </div>
            <p className="text-sm font-sans leading-relaxed mb-8" style={{ color: 'var(--muted)' }}>
              The next cigarette is the one that matters — not the one that just happened.
            </p>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-sans font-medium text-base"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              Back to tracking
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
