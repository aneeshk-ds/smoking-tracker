import { useEffect, useState } from 'react'
import { getPatternInsights } from '../lib/insights'

const TYPE_DOT = {
  trigger: { color: 'var(--danger)', label: 'T' },
  time:    { color: 'var(--accent)', label: 'W' },
  location:{ color: 'var(--muted)', label: 'L' },
}

function InsightRow({ insight }) {
  const dot = TYPE_DOT[insight.type] ?? TYPE_DOT.time
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: dot.color }}
        />
        <span className="text-[11px] font-mono tracking-wide" style={{ color: 'var(--dim)' }}>
          {insight.label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-mono" style={{ color: 'var(--text)' }}>
          {insight.value}
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--dim)' }}>
          {insight.detail}
        </span>
      </div>
    </div>
  )
}

export default function InsightCard({ refreshKey }) {
  const [data, setData] = useState(undefined) // undefined = loading

  useEffect(() => {
    getPatternInsights()
      .then(setData)
      .catch(() => setData(null))
  }, [refreshKey])

  // null = not enough data yet, undefined = still loading — either way, render nothing
  if (!data) return null

  const { insights, totalEntries } = data

  return (
    <div
      className="mb-6 rounded-lg px-4 pt-3 pb-2"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        className="flex items-center justify-between mb-1"
      >
        <span
          className="text-[10px] font-mono tracking-widest uppercase"
          style={{ color: 'var(--dim)' }}
        >
          your pattern
        </span>
        <span
          className="text-[10px] font-mono"
          style={{ color: 'var(--dim)' }}
        >
          {totalEntries} entries
        </span>
      </div>

      <div
        className="border-t mb-1"
        style={{ borderColor: 'var(--border)' }}
      />

      {insights.map((insight) => (
        <InsightRow key={insight.type} insight={insight} />
      ))}

      <div
        className="text-[9px] font-mono mt-1 pt-1.5 border-t"
        style={{ color: 'var(--dim)', borderColor: 'var(--border)' }}
      >
        computed on-device · your data never leaves this phone
      </div>
    </div>
  )
}
