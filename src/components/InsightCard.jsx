import { useEffect, useState } from 'react'
import { getPatternInsights } from '../lib/insights'
import InfoTip from './InfoTip'
import { HELP } from '../lib/help'

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
        <span className="text-[11px] font-sans tracking-wide" style={{ color: 'var(--dim)' }}>
          {insight.label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-sans" style={{ color: 'var(--text)' }}>
          {insight.value}
        </span>
        <span className="text-[10px] font-sans" style={{ color: 'var(--dim)' }}>
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

  // undefined = still loading, show nothing
  if (data === undefined) return null

  // locked = not enough entries yet — show teaser
  if (data === null || data.locked) {
    const count = data?.totalEntries ?? 0
    const needed = data?.needed ?? 7
    const pct = Math.round((count / needed) * 100)
    return (
      <div
        className="mb-6 rounded-lg px-4 pt-3 pb-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1 text-[10px] font-sans tracking-widest uppercase" style={{ color: 'var(--dim)' }}>
            your pattern
            <InfoTip text={HELP.insight.text} label={HELP.insight.label} size={13} />
          </span>
          <span className="text-[10px] font-sans" style={{ color: 'var(--dim)' }}>
            {count}/{needed} entries
          </span>
        </div>
        <div className="h-0.5 rounded-full mb-2.5" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: 'var(--accent)', opacity: 0.4 }}
          />
        </div>
        <p className="text-[11px] font-sans leading-relaxed" style={{ color: 'var(--dim)' }}>
          add trigger &amp; location details when logging — your patterns will surface here after {needed} entries
        </p>
      </div>
    )
  }

  const { insights, totalEntries } = data

  return (
    <div
      className="mb-6 rounded-lg px-4 pt-3 pb-2"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-[10px] font-sans tracking-widest uppercase" style={{ color: 'var(--dim)' }}>
          your pattern
          <InfoTip text={HELP.insight.text} label={HELP.insight.label} size={13} />
        </span>
        <span className="text-[10px] font-sans" style={{ color: 'var(--dim)' }}>
          {totalEntries} entries
        </span>
      </div>

      <div className="border-t mb-1" style={{ borderColor: 'var(--border)' }} />

      {insights.map((insight) => (
        <InsightRow key={insight.type} insight={insight} />
      ))}

      <div
        className="text-[9px] font-sans mt-1 pt-1.5 border-t"
        style={{ color: 'var(--dim)', borderColor: 'var(--border)' }}
      >
        computed on-device · your data never leaves this phone
      </div>
    </div>
  )
}
