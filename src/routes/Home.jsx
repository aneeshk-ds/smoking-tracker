import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  getTodayCount,
  getTodaySpend,
  getCurrentStreakHonest,
  getProjectedCost,
  getSettings,
  getSmokeFreeRate,
} from '../lib/storage'
import { performBackup } from '../lib/backup'
import { formatCurrency } from '../lib/format'
import BottomNav from '../components/BottomNav'
import LogButton from '../components/LogButton'
import StatBlock from '../components/StatBlock'
import HonestStreakDisplay from '../components/HonestStreakDisplay'
import EquivalentLine from '../components/EquivalentLine'
import InstallBanner from '../components/InstallBanner'
import BackupBanner from '../components/BackupBanner'
import WeekMonthSnapshot from '../components/WeekMonthSnapshot'
import TodayLog from '../components/TodayLog'
import InsightCard from '../components/InsightCard'
import LapseRecoveryModal from '../components/LapseRecoveryModal'
import CravingModal from '../components/CravingModal'

const GOAL_LABEL = { awareness: 'AWARE', reduce: 'REDUCE', quit: 'QUIT' }

const REASON_PHRASE = {
  family:  'for your family',
  health:  'for your health',
  partner: 'for your partner',
  child:   'for your child',
  money:   'to save money',
  fitness: 'for your fitness',
  control: 'to feel in control',
  doctor:  'on doctor\'s advice',
}

export default function Home() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showLapse, setShowLapse] = useState(false)
  const [lapseInfo, setLapseInfo] = useState(null)
  const [showCraving, setShowCraving] = useState(false)

  const load = useCallback(async () => {
    const [count, spend, streak, projected, settings, smokeFreeRate] = await Promise.all([
      getTodayCount(),
      getTodaySpend(),
      getCurrentStreakHonest(),
      getProjectedCost(10),
      getSettings(),
      getSmokeFreeRate(30),
    ])
    const currency = settings?.currency ?? 'INR'
    setData({ count, spend, streak, projected, currency, settings, smokeFreeRate })
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const handleLogged = useCallback(async () => {
    setRefreshKey((k) => k + 1)
    performBackup().catch(() => {})

    // Check if this log tipped the day into a slip
    const [count, settings] = await Promise.all([getTodayCount(), getSettings()])
    const goal = settings?.goal ?? 'awareness'
    const dailyTarget = settings?.dailyTarget ?? null
    const isFirstSlip =
      (goal === 'quit' && count === 1) ||
      (goal === 'reduce' && dailyTarget !== null && count === dailyTarget + 1)

    if (isFirstSlip) {
      // Compute previous run for the recovery message
      const streak = await getCurrentStreakHonest()
      const previousRun =
        goal === 'reduce'
          ? (streak?.currentRun ?? 0)
          : (streak?.daysSinceLast ?? 0)

      setLapseInfo({
        previousRun,
        goal,
        quitReason: settings?.quitReason ?? null,
      })
      setShowLapse(true)
    }
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>
    )
  }

  const { count, spend, streak, projected, currency, settings, smokeFreeRate } = data
  const goal = settings?.goal ?? 'awareness'
  const quitReason = settings?.quitReason ?? null
  const today = new Date()
  const dateLabel = format(today, 'EEE · d MMM')

  return (
    <div className="min-h-screen bg-bg flex flex-col pb-24">
      <InstallBanner />
      <BackupBanner />
      <div className="flex-1 px-6 pt-10 max-w-md mx-auto w-full">

        {/* Header row */}
        <div className="flex items-center justify-between mb-10">
          <span className="text-muted text-xs font-mono tracking-wide">{dateLabel}</span>
          <span
            className="text-xs font-mono tracking-widest px-2 py-1 rounded-md border"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            {GOAL_LABEL[goal] ?? 'TRACK'}
          </span>
        </div>

        {/* Primary stat */}
        <div className="mb-8">
          <div className="text-muted text-xs font-mono tracking-widest uppercase mb-1">Today</div>
          <div className="stat-number text-text">{count}</div>
          <div className="text-muted text-sm font-mono mt-1">
            cigarette{count !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Week / Month snapshot */}
        <WeekMonthSnapshot key={refreshKey} />

        {/* Pattern insights */}
        <InsightCard refreshKey={refreshKey} />

        {/* Secondary stats */}
        <div className="mb-8 border-t border-border pt-4">
          <StatBlock
            label="Spent today"
            value={formatCurrency(spend, currency)}
          />
          <StatBlock
            label="Momentum"
            value={<HonestStreakDisplay streak={streak} />}
          />
          {smokeFreeRate && (
            <StatBlock
              label="Success rate"
              value={
                <span style={{ color: smokeFreeRate.rate >= 70 ? 'var(--accent)' : 'var(--muted)' }}>
                  {smokeFreeRate.rate}%
                </span>
              }
              subtitle={`${smokeFreeRate.smokeFree} of ${smokeFreeRate.total} days on target`}
            />
          )}
          <StatBlock
            label="10-yr projection"
            value={formatCurrency(projected, currency)}
            valueClass="text-danger"
          />
          <div className="pt-1">
            <EquivalentLine key={refreshKey} />
          </div>
        </div>

        {/* Log button */}
        <div className="mb-2">
          <LogButton onLogged={handleLogged} onLongPress={() => navigate('/log')} />
        </div>
        <p className="text-dim text-xs font-mono text-center mb-3">
          hold to add details
        </p>

        {/* Craving button */}
        <button
          onClick={() => setShowCraving(true)}
          className="w-full py-3 rounded-2xl border text-xs font-mono transition-all mb-1"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
        >
          craving right now? tap for a 10-min delay
        </button>

        {/* Personal reason */}
        {quitReason && REASON_PHRASE[quitReason] && (
          <p className="text-[10px] font-mono text-center mt-2" style={{ color: 'var(--dim)' }}>
            {REASON_PHRASE[quitReason]}
          </p>
        )}

        {/* Today's log */}
        <TodayLog refreshKey={refreshKey} onChanged={handleLogged} />
      </div>

      <BottomNav />

      {showLapse && lapseInfo && (
        <LapseRecoveryModal
          previousRun={lapseInfo.previousRun}
          goal={lapseInfo.goal}
          quitReason={lapseInfo.quitReason}
          onClose={() => setShowLapse(false)}
        />
      )}

      {showCraving && (
        <CravingModal onClose={() => setShowCraving(false)} />
      )}
    </div>
  )
}
