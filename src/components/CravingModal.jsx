import { useState, useEffect, useRef } from 'react'

const TIPS = [
  'drink a full glass of water — slowly',
  'move away from where you are right now',
  'take 10 deep breaths before deciding',
  'the urge will peak and pass within 5 minutes',
  'chew gum or saunf — the oral habit helps',
]

const BREATHE_PHASES = [
  { label: 'Breathe in', duration: 4 },
  { label: 'Hold', duration: 4 },
  { label: 'Breathe out', duration: 4 },
]

function TimerMode({ onClose }) {
  const TOTAL = 10 * 60 // 10 minutes in seconds
  const [remaining, setRemaining] = useState(TOTAL)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => setRemaining((r) => r - 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, remaining])

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const done = remaining === 0

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-xs font-mono text-center" style={{ color: 'var(--muted)' }}>
        delay for 10 minutes — most cravings pass before the timer ends
      </p>

      <div
        className="font-display text-center leading-none"
        style={{ fontSize: 'clamp(3.5rem, 18vw, 5rem)', color: done ? 'var(--accent)' : 'var(--text)' }}
      >
        {done ? 'done' : `${mins}:${secs}`}
      </div>

      {!done ? (
        <button
          onClick={() => setRunning((v) => !v)}
          className="w-full py-3.5 rounded-2xl font-mono text-sm"
          style={{ background: running ? 'var(--surface-2)' : 'var(--accent)', color: running ? 'var(--muted)' : 'var(--bg)', border: '1px solid var(--border)' }}
        >
          {running ? 'pause' : 'start timer'}
        </button>
      ) : (
        <div className="w-full flex flex-col gap-2">
          <p className="text-sm font-mono text-center" style={{ color: 'var(--accent)' }}>
            craving passed — you held it
          </p>
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl font-mono text-sm"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            close
          </button>
        </div>
      )}
    </div>
  )
}

function BreatheMode() {
  const [active, setActive] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [tick, setTick] = useState(0)
  const intervalRef = useRef(null)

  const phase = BREATHE_PHASES[phaseIdx]

  useEffect(() => {
    if (!active) { clearInterval(intervalRef.current); return }
    setTick(0)
    intervalRef.current = setInterval(() => {
      setTick((t) => {
        if (t + 1 >= phase.duration) {
          setPhaseIdx((p) => (p + 1) % BREATHE_PHASES.length)
          return 0
        }
        return t + 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [active, phaseIdx])

  const progress = active ? (tick / phase.duration) * 100 : 0
  const circumference = 2 * Math.PI * 52

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="text-xs font-mono text-center" style={{ color: 'var(--muted)' }}>
        4-4-4 breathing — two rounds is enough to soften a craving
      </p>

      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" strokeWidth="3" stroke="var(--border)" />
          <circle
            cx="60" cy="60" r="52" fill="none" strokeWidth="3"
            stroke="var(--accent)"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl" style={{ color: 'var(--text)' }}>
            {active ? phase.duration - tick : '·'}
          </span>
          <span className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--muted)' }}>
            {active ? phase.label.toLowerCase() : 'ready'}
          </span>
        </div>
      </div>

      <button
        onClick={() => { setActive((v) => !v); setPhaseIdx(0); setTick(0) }}
        className="w-full py-3.5 rounded-2xl font-mono text-sm"
        style={{ background: active ? 'var(--surface-2)' : 'var(--accent)', color: active ? 'var(--muted)' : 'var(--bg)', border: '1px solid var(--border)' }}
      >
        {active ? 'stop' : 'start breathing'}
      </button>
    </div>
  )
}

export default function CravingModal({ onClose }) {
  const [tab, setTab] = useState('timer')

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
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--border)' }} />

        <h2 className="font-display text-xl mb-1" style={{ color: 'var(--text)' }}>Craving right now?</h2>
        <p className="text-xs font-mono mb-5" style={{ color: 'var(--dim)' }}>
          this will pass — pick a tool to hold it off
        </p>

        {/* Tab bar */}
        <div className="flex rounded-xl border border-border overflow-hidden mb-5">
          {[{ key: 'timer', label: '10-min delay' }, { key: 'breathe', label: 'breathe' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex-1 py-2.5 text-xs font-mono transition-colors"
              style={{
                background: tab === key ? 'var(--accent)' : 'var(--surface-2)',
                color: tab === key ? 'var(--bg)' : 'var(--muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'timer' && <TimerMode onClose={onClose} />}
        {tab === 'breathe' && <BreatheMode />}

        {/* Tips */}
        <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-mono mb-2 uppercase tracking-widest" style={{ color: 'var(--dim)' }}>quick tips</p>
          {TIPS.map((tip) => (
            <div key={tip} className="flex items-start gap-2 mb-1.5">
              <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--dim)' }} />
              <p className="text-[11px] font-mono" style={{ color: 'var(--dim)' }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
