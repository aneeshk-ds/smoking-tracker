import { useEffect, useState, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  getTodayCount,
  getTodaySpend,
  getCurrentStreakHonest,
  getSmokingStreak,
  getProjectedCost,
  getSettings,
  getSmokeFreeRate,
  logCigarette,
} from '../lib/storage'
import { performBackup } from '../lib/backup'
import { formatCurrency } from '../lib/format'
import BottomNav from '../components/BottomNav'
import BreathingOrb from '../components/BreathingOrb'
import StreakDisplay from '../components/StreakDisplay'
import InsightCard from '../components/InsightCard'
import InstallBanner from '../components/InstallBanner'
import BackupBanner from '../components/BackupBanner'
import LapseRecoveryModal from '../components/LapseRecoveryModal'
import CravingModal from '../components/CravingModal'
import TodayLog from '../components/TodayLog'
import ReasonCard from '../components/ReasonCard'
import InfoTip from '../components/InfoTip'
import { HELP } from '../lib/help'
import Tour from '../components/Tour'
import { shouldShowTour } from '../lib/tour'

const GOAL_LABEL = { awareness: 'AWARE', reduce: 'REDUCE', quit: 'QUIT' }

function computeOrbStatus(count, goal, dailyTarget) {
  if (goal === 'quit') return count === 0 ? 'good' : 'warning'
  if (goal === 'reduce' && dailyTarget !== null) return count <= dailyTarget ? 'good' : 'warning'
  return 'neutral'
}

function QuickLogButton({ onLogged, onLongPress, saving }) {
  const holdRef = useRef(null)

  const startHold = () => {
    holdRef.current = setTimeout(() => {
      clearTimeout(holdRef.current)
      holdRef.current = null
      onLongPress()
    }, 550)
  }
  const cancelHold = () => {
    if (holdRef.current) {
      clearTimeout(holdRef.current)
      holdRef.current = null
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        onTouchCancel={cancelHold}
        onClick={!saving ? onLogged : undefined}
        disabled={saving}
        className="w-full py-4 rounded-2xl text-base font-bold tracking-wide transition-all active:scale-95 disabled:opacity-60"
        style={{
          background: 'var(--accent)',
          color: '#0D1420',
          boxShadow: '0 4px 24px rgba(167,139,250,0.32)',
        }}
      >
        {saving ? 'Logging...' : (
          <span className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 9 Q4.2 7.5 5 6" strokeWidth="1.4" opacity="0.7" />
              <path d="M8 8.5 Q7.2 7 8 5.5" strokeWidth="1.4" opacity="0.5" />
              <rect x="3" y="11" width="14" height="3.5" rx="1.75" />
              <rect x="17" y="11" width="4" height="3.5" rx="1" opacity="0.55" />
              <circle cx="3.2" cy="12.75" r="1.1" fill="currentColor" />
            </svg>
            Log a cigarette
          </span>
        )}
      </button>
      <p className="text-xs font-normal" style={{ color: 'var(--dim)' }}>
        hold to add brand, mood, or trigger
      </p>
    </div>
  )
}

function StatPill({ label, value, valueColor, help }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-3 py-3 rounded-2xl flex-1"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span
        className="text-base font-bold leading-tight"
        style={{ color: valueColor ?? 'var(--text)' }}
      >
        {value}
      </span>
      <span className="flex items-center gap-1 text-xs font-normal mt-0.5 text-center" style={{ color: 'var(--muted)' }}>
        {label}
        {help && <InfoTip text={help.text} label={help.label} size={12} />}
      </span>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [data, setData]             = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [saving, setSaving]         = useState(false)
  const [showLapse, setShowLapse]   = useState(false)
  const [lapseInfo, setLapseInfo]   = useState(null)
  const [showCraving, setShowCraving] = useState(false)
  const [showTour, setShowTour] = useState(false)

  const load = useCallback(async () => {
    const [count, spend, streak, smokingStreak, projected, settings, smokeFreeRate] = await Promise.all([
      getTodayCount(),
      getTodaySpend(),
      getCurrentStreakHonest(),
      getSmokingStreak(),
      getProjectedCost(10),
      getSettings(),
      getSmokeFreeRate(30),
    ])
    setData({ count, spend, streak, smokingStreak, projected, settings, smokeFreeRate })
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  useEffect(() => {
    if (data && shouldShowTour()) setShowTour(true)
  }, [data])

  const handleLogged = useCallback(async () => {
    setSaving(false)
    setRefreshKey((k) => k + 1)
    performBackup().catch(() => {})

    const [count, settings] = await Promise.all([getTodayCount(), getSettings()])
    const goal        = settings?.goal ?? 'awareness'
    const dailyTarget = settings?.dailyTarget ?? null
    const isFirstSlip =
      (goal === 'quit' && count === 1) ||
      (goal === 'reduce' && dailyTarget !== null && count === dailyTarget + 1)

    if (isFirstSlip) {
      const streak      = await getCurrentStreakHonest()
      const previousRun = goal === 'reduce'
        ? (streak?.currentRun ?? 0)
        : (streak?.daysSinceLast ?? 0)
      setLapseInfo({ previousRun, goal, settings })
      setShowLapse(true)
    }
  }, [])

  const handleQuickLog = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      await logCigarette()
      await handleLogged()
    } catch {
      setSaving(false)
    }
  }, [saving, handleLogged])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg)' }}>
        <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
      </div>
    )
  }

  const { count, spend, streak, smokingStreak, projected, settings, smokeFreeRate } = data
  const goal        = settings?.goal ?? 'awareness'
  const dailyTarget = settings?.dailyTarget ?? null
  const currency    = settings?.currency ?? 'INR'
  const orbStatus   = computeOrbStatus(count, goal, dailyTarget)
  const dateLabel   = format(new Date(), 'EEE, d MMM')

  return (
    <div className="min-h-screen flex flex-col pb-28" style={{ background: 'var(--bg)' }}>
      <InstallBanner />
      <BackupBanner />

      <div className="flex-1 px-5 pt-8 max-w-md mx-auto w-full flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>
            {dateLabel}
          </span>
          <div className="flex items-center gap-1.5" data-tour="goal">
            <span
              className="text-xs font-bold tracking-widest px-2.5 py-1 rounded-lg"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {GOAL_LABEL[goal] ?? 'TRACK'}
            </span>
            <InfoTip text={HELP.goal.text} label={HELP.goal.label} size={14} />
          </div>
        </div>

        {/* Breathing orb */}
        <div className="relative flex justify-center py-3" data-tour="orb">
          <BreathingOrb
            count={count}
            status={orbStatus}
            goal={goal}
            dailyTarget={dailyTarget}
          />
          <div className="absolute top-3 right-0">
            <InfoTip text={HELP.orb.text} label={HELP.orb.label} size={15} />
          </div>
        </div>

        {/* Streak */}
        <div data-tour="streak"><StreakDisplay streak={streak} smokingStreak={smokingStreak} /></div>

        {/* Why you're quitting */}
        <div data-tour="reason"><ReasonCard settings={settings} /></div>

        {/* Quick log */}
        <div data-tour="log"><QuickLogButton
          onLogged={handleQuickLog}
          onLongPress={() => navigate('/log')}
          saving={saving}
        /></div>

        {/* Craving */}
        <button
          onClick={() => setShowCraving(true)}
          className="w-full py-3 rounded-2xl text-sm font-normal transition-all"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--muted)',
          }}
        >
          craving right now? tap for a 10-min delay
        </button>

        {/* Stat pills */}
        <div className="flex gap-2.5" data-tour="pills">
          <StatPill label="today" value={formatCurrency(spend, currency)} help={HELP.spendToday} />
          {smokeFreeRate && (
            <StatPill
              label={goal === 'quit' ? 'smoke-free 30d' : 'on target 30d'}
              value={`${smokeFreeRate.rate}%`}
              valueColor={smokeFreeRate.rate >= 70 ? 'var(--success)' : 'var(--muted)'}
              help={HELP.onTargetRate}
            />
          )}
          <StatPill
            label="10yr cost"
            value={formatCurrency(projected, currency)}
            valueColor="var(--danger)"
            help={HELP.projectedCost}
          />
        </div>

        {/* Pattern insight */}
        <InsightCard refreshKey={refreshKey} />

        {/* Today's log */}
        <TodayLog refreshKey={refreshKey} onChanged={handleLogged} />
      </div>

      <BottomNav />

      {showLapse && lapseInfo && (
        <LapseRecoveryModal
          previousRun={lapseInfo.previousRun}
          goal={lapseInfo.goal}
          settings={lapseInfo.settings}
          onClose={() => setShowLapse(false)}
        />
      )}

      {showCraving && (
        <CravingModal onClose={() => setShowCraving(false)} />
      )}

      {showTour && <Tour onClose={() => setShowTour(false)} />}
    </div>
  )
}
