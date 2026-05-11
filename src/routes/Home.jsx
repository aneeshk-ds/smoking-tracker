import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  getTodayCount,
  getTodaySpend,
  getCurrentStreakHonest,
  getProjectedCost,
  getSettings,
} from '../lib/storage'
import { formatCurrency } from '../lib/format'
import BottomNav from '../components/BottomNav'
import LogButton from '../components/LogButton'
import StatBlock from '../components/StatBlock'
import HonestStreakDisplay from '../components/HonestStreakDisplay'
import EquivalentLine from '../components/EquivalentLine'
import InstallBanner from '../components/InstallBanner'
import BackupBanner from '../components/BackupBanner'

const GOAL_LABEL = { awareness: 'AWARE', reduce: 'REDUCE', quit: 'QUIT' }

export default function Home() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    const [count, spend, streak, projected, settings] = await Promise.all([
      getTodayCount(),
      getTodaySpend(),
      getCurrentStreakHonest(),
      getProjectedCost(10),
      getSettings(),
    ])
    const currency = settings?.currency ?? 'INR'
    setData({ count, spend, streak, projected, currency, settings })
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const handleLogged = () => setRefreshKey((k) => k + 1)

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>
    )
  }

  const { count, spend, streak, projected, currency, settings } = data
  const goal = settings?.goal ?? 'awareness'
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

        {/* Secondary stats */}
        <div className="mb-8 border-t border-border pt-4">
          <StatBlock
            label="Spent today"
            value={formatCurrency(spend, currency)}
          />
          <StatBlock
            label="Streak"
            value={<HonestStreakDisplay streak={streak} />}
          />
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
        <p className="text-dim text-xs font-mono text-center">
          hold to add details
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
