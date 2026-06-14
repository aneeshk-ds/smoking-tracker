import { useEffect, useState } from 'react'
import { getWeekSnapshot, getMonthSnapshot } from '../lib/storage'

function Delta({ current, previous, label }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return null

  const diff = current - previous
  const pct = Math.round(Math.abs(diff / previous) * 100)
  if (pct === 0) return null

  const down = diff < 0
  return (
    <span
      className="text-[10px] font-sans ml-1"
      style={{ color: down ? 'var(--accent)' : 'var(--danger)' }}
    >
      {down ? '↓' : '↑'}{pct}%
    </span>
  )
}

export default function WeekMonthSnapshot() {
  const [data, setData] = useState(null)

  useEffect(() => {
    Promise.all([getWeekSnapshot(), getMonthSnapshot()]).then(([week, month]) => {
      setData({ week, month })
    })
  }, [])

  if (!data) return null

  const { week, month } = data

  return (
    <div
      className="rounded-2xl border px-4 py-3 mb-6 flex gap-0"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      {/* This week */}
      <div className="flex-1 border-r pr-4" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[10px] font-sans tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>
          This week
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl" style={{ color: 'var(--text)' }}>
            {week.thisWeek}
          </span>
          <Delta current={week.thisWeek} previous={week.lastWeek} />
        </div>
        <div className="text-[10px] font-sans mt-0.5" style={{ color: 'var(--dim)' }}>
          last: {week.lastWeek}
        </div>
      </div>

      {/* This month */}
      <div className="flex-1 pl-4">
        <div className="text-[10px] font-sans tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>
          This month
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl" style={{ color: 'var(--text)' }}>
            {month.thisMonth}
          </span>
          <Delta current={month.thisMonth} previous={month.lastMonth} />
        </div>
        <div className="text-[10px] font-sans mt-0.5" style={{ color: 'var(--dim)' }}>
          last: {month.lastMonth}
        </div>
      </div>
    </div>
  )
}
