import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getLastCigaretteTime, getSettings } from '../lib/storage'
import {
  MILESTONES,
  splitMilestones,
  getNextMilestoneProgress,
  timeUntilLabel,
} from '../lib/health-milestones'
import BottomNav from '../components/BottomNav'

export default function Health() {
  const navigate = useNavigate()
  const [lastTs, setLastTs] = useState(undefined) // undefined = loading, null = none
  const [elapsed, setElapsed] = useState(0) // ms
  const [currency, setCurrency] = useState('INR')
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)

  useEffect(() => {
    Promise.all([getLastCigaretteTime(), getSettings()]).then(([ts, s]) => {
      setLastTs(ts ?? null)
      setCurrency(s?.currency ?? 'INR')
    })
  }, [])

  useEffect(() => {
    if (!lastTs) return
    const tick = () => setElapsed(Date.now() - lastTs)
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [lastTs])

  const totalMinutes = Math.floor(elapsed / 60000)
  const { reached, upcoming } = lastTs
    ? splitMilestones(totalMinutes)
    : { reached: [], upcoming: MILESTONES }
  const { next, progress } = getNextMilestoneProgress(lastTs ? totalMinutes : 0)
  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, 4)

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-bg px-6 pt-8 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="text-muted hover:text-text transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
        </button>
        <h1 className="font-display text-2xl text-text">Health</h1>
      </div>

      <div className="px-4 max-w-md mx-auto space-y-3 mt-1">

        {/* ── Elapsed time card ── */}
        {lastTs === undefined ? (
          <div className="h-24 rounded-2xl border border-border bg-surface flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
        ) : lastTs === null ? (
          <div className="rounded-2xl border border-border bg-surface p-5 text-center">
            <p className="text-muted text-xs font-sans">Log your first cigarette to start tracking recovery.</p>
          </div>
        ) : (
          <ElapsedCard elapsed={elapsed} next={next} progress={progress} />
        )}

        {/* ── Reached milestones ── */}
        {reached.length > 0 && (
          <section>
            <SectionHeader label="REACHED" count={reached.length} accent />
            <div className="space-y-2 mt-2">
              {[...reached].reverse().map((m) => (
                <MilestoneCard key={m.id} milestone={m} reached />
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming milestones ── */}
        {upcoming.length > 0 && (
          <section>
            <SectionHeader label={lastTs ? 'UPCOMING' : 'RECOVERY TIMELINE'} />
            <div className="space-y-2 mt-2">
              {visibleUpcoming.map((m) => (
                <MilestoneCard
                  key={m.id}
                  milestone={m}
                  reached={false}
                  timeLabel={lastTs ? timeUntilLabel(m.minutesRequired, totalMinutes) : null}
                />
              ))}
            </div>
            {upcoming.length > 4 && (
              <button
                onClick={() => setShowAllUpcoming((v) => !v)}
                className="w-full mt-2 py-2.5 rounded-xl border border-border bg-surface-2 text-dim text-xs font-sans"
              >
                {showAllUpcoming ? 'Show less' : `+${upcoming.length - 4} more milestones`}
              </button>
            )}
          </section>
        )}

        {/* ── India Quitline card ── */}
        {currency === 'INR' && (
          <div
            className="rounded-2xl p-4"
            style={{
              border: '1px solid rgba(0,229,160,0.2)',
              backgroundColor: 'rgba(0,229,160,0.04)',
            }}
          >
            <div className="text-[10px] font-sans text-muted mb-1 uppercase tracking-wide">Support</div>
            <div className="text-text text-sm font-sans font-medium mb-0.5">iCall Counselling</div>
            <div className="text-accent font-sans text-xl font-medium tracking-wide">9152987821</div>
            <div className="text-dim text-[10px] font-sans mt-1.5 leading-relaxed">
              Mon-Sat, 8am-10pm. Free, confidential.
              <br />TISS Mumbai. Covers addiction and quit support.
            </div>
          </div>
        )}

        {/* ── Source footnote ── */}
        <p className="text-dim text-[10px] font-sans text-center pb-2">
          Milestones sourced from WHO, CDC, and NHS guidelines.
        </p>

      </div>
      <BottomNav />
    </div>
  )
}

// ── Sub-components ──

function ElapsedCard({ elapsed, next, progress }) {
  const { days, hours, minutes } = parseElapsed(elapsed)

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-[10px] font-sans text-muted mb-3 uppercase tracking-wide">
        Time smoke-free
      </div>

      {/* Big elapsed numbers */}
      <div className="flex items-end gap-5 mb-4">
        {days > 0 && <TimeUnit value={days} unit="days" large />}
        <TimeUnit value={hours} unit="hrs" large={days === 0} />
        <TimeUnit value={minutes} unit="min" />
      </div>

      {/* Progress bar to next milestone */}
      {next ? (
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-muted text-[10px] font-sans">
              Next: <span className="text-text">{next.label}</span> — {next.title}
            </span>
            <span className="text-dim text-[10px] font-sans">{progress}%</span>
          </div>
          <div className="h-1 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
            />
          </div>
        </div>
      ) : (
        <div className="text-accent text-xs font-sans">All milestones reached.</div>
      )}
    </div>
  )
}

function TimeUnit({ value, unit, large }) {
  return (
    <div className="flex flex-col items-center min-w-0">
      <span
        className="font-display leading-none"
        style={{
          fontSize: large ? 'clamp(2.5rem, 10vw, 3.5rem)' : 'clamp(1.6rem, 6vw, 2.2rem)',
          color: 'var(--text)',
        }}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-dim text-[10px] font-sans mt-1">{unit}</span>
    </div>
  )
}

function SectionHeader({ label, count, accent }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span
        className="text-[10px] font-sans font-medium tracking-widest uppercase"
        style={{ color: accent ? 'var(--accent)' : 'var(--dim)' }}
      >
        {label}
      </span>
      {count != null && (
        <span
          className="text-[9px] font-sans px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: accent ? 'rgba(0,229,160,0.12)' : 'var(--surface-2)',
            color: accent ? 'var(--accent)' : 'var(--dim)',
          }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

function MilestoneCard({ milestone, reached, timeLabel }) {
  return (
    <div
      className="rounded-xl p-3 flex items-start gap-3"
      style={{
        border: `1px solid ${reached ? 'rgba(0,229,160,0.25)' : 'var(--border)'}`,
        backgroundColor: reached ? 'rgba(0,229,160,0.04)' : 'var(--surface)',
      }}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 mt-0.5">
        {reached ? (
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,229,160,0.2)' }}
          >
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
              <path
                d="M2 5l2 2 4-4"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <div className="w-4 h-4 rounded-full border" style={{ borderColor: 'var(--border)' }} />
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="text-[10px] font-sans"
            style={{ color: reached ? 'var(--accent)' : 'var(--muted)' }}
          >
            {milestone.label}
          </span>
          {timeLabel && !reached && (
            <span className="text-[10px] font-sans text-dim flex-shrink-0">{timeLabel}</span>
          )}
        </div>
        <div
          className="text-xs font-sans font-medium mt-0.5"
          style={{ color: reached ? 'var(--text)' : 'var(--muted)' }}
        >
          {milestone.title}
        </div>
        <div
          className="text-[10px] font-sans mt-0.5 leading-relaxed"
          style={{ color: reached ? 'var(--muted)' : 'var(--dim)' }}
        >
          {milestone.body}
        </div>
      </div>
    </div>
  )
}

function parseElapsed(ms) {
  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  return { days, hours, minutes }
}
