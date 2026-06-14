import { useEffect, useState } from 'react'
import {
  getHeatmapData,
  getWeekdayWeekendBreakdown,
  getTrendSeries,
  getTriggerBreakdown,
  getLocationBreakdown,
  getSettings,
  getCigarettesByRange,
  getMoneySaved,
  getCravingTrend,
} from '../lib/storage'
import { formatCurrency } from '../lib/format'
import BottomNav from '../components/BottomNav'
import Heatmap from '../components/Heatmap'
import TrendChart from '../components/TrendChart'
import BarBreakdown from '../components/BarBreakdown'
import WeekdayWeekendSplit from '../components/WeekdayWeekendSplit'
import ProjectionCard from '../components/ProjectionCard'

const RANGES = [7, 30, 90]

export default function Insights() {
  const [range, setRange] = useState(30)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    async function load() {
      const endMs = Date.now()
      const startMs = endMs - range * 24 * 60 * 60 * 1000

      const [
        heatmap,
        weekSplit,
        trend,
        triggers,
        locations,
        settings,
        cigs,
        moneySaved,
        cravingTrend,
      ] = await Promise.all([
        getHeatmapData(range),
        getWeekdayWeekendBreakdown(range),
        getTrendSeries(range),
        getTriggerBreakdown(range),
        getLocationBreakdown(range),
        getSettings(),
        getCigarettesByRange(startMs, endMs),
        getMoneySaved(range),
        getCravingTrend(range),
      ])

      if (!mounted) return

      const totalSmoked = cigs.length
      const totalSpent = cigs.reduce((s, c) => s + (c.cost || 0), 0)
      const avgPerDay = range > 0 ? Math.round((totalSmoked / range) * 10) / 10 : 0
      const dailyCost = range > 0 ? totalSpent / range : 0

      // Most active hour across period
      const hourCounts = new Array(24).fill(0)
      for (const c of cigs) {
        hourCounts[new Date(c.timestamp).getHours()]++
      }
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts))

      setData({
        heatmap, weekSplit, trend, triggers, locations,
        settings, totalSmoked, totalSpent, avgPerDay,
        dailyCost, moneySaved, cravingTrend,
        currency: settings?.currency ?? 'INR',
        dailyTarget: settings?.goal === 'reduce' ? settings.dailyTarget : null,
        peakHour,
      })
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [range])

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Sticky header + range pills */}
      <div className="sticky top-0 z-10 bg-bg px-6 pt-8 pb-3">
        <h1 className="font-display text-2xl text-text mb-4">Insights</h1>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex-1 py-2 rounded-xl text-xs font-sans border transition-all duration-150 ${
                range === r
                  ? 'bg-accent text-bg border-accent'
                  : 'bg-surface-2 text-muted border-border'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
      ) : (
        <div className="px-4 max-w-md mx-auto space-y-3">

          {/* ── Summary strip ── */}
          <div className="grid grid-cols-4 gap-2">
            <SummaryCell label="Total" value={data.totalSmoked} unit="cigs" />
            <SummaryCell label="Avg/day" value={data.avgPerDay} unit="" />
            <SummaryCell label="Spent" value={formatCurrency(data.totalSpent, data.currency)} unit="" small />
            {data.moneySaved > 0 ? (
              <SummaryCell label="Saved" value={formatCurrency(data.moneySaved, data.currency)} unit="" accent small />
            ) : (
              <SummaryCell label="Peak" value={formatHour(data.peakHour)} unit="" small />
            )}
          </div>

          {/* ── Weekday vs Weekend ── */}
          <Card title="Weekday vs Weekend">
            <WeekdayWeekendSplit data={data.weekSplit} />
          </Card>

          {/* ── Heatmap ── */}
          <Card title="When you smoke" subtitle={`Last ${range} days`}>
            <Heatmap grid={data.heatmap} />
          </Card>

          {/* ── Trend ── */}
          <Card
            title="Daily count"
            subtitle={data.dailyTarget ? `Target: ${data.dailyTarget}/day` : null}
            dangerSubtitle={!!data.dailyTarget}
          >
            <TrendChart data={data.trend} dailyTarget={data.dailyTarget} />
          </Card>

          {/* ── Triggers + Locations side by side ── */}
          <div className="grid grid-cols-2 gap-3">
            <Card title="Triggers" compact>
              <BarBreakdown items={data.triggers} />
            </Card>
            <Card title="Locations" compact>
              <BarBreakdown items={data.locations} color="var(--muted)" />
            </Card>
          </div>

          {/* ── Craving intensity trend ── */}
          {data.cravingTrend && (
            <Card title="Craving intensity" subtitle="avg per day — lower is better">
              <CravingTrendChart data={data.cravingTrend} />
            </Card>
          )}

          {/* ── Cost projection ── */}
          <Card title="If nothing changes" subtitle="Projected spend">
            <ProjectionCard dailyCost={data.dailyCost} currency={data.currency} />
          </Card>

        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ── Sub-components ──

function Card({ title, subtitle, dangerSubtitle, compact, children }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-text text-xs font-sans font-medium tracking-wide uppercase">{title}</span>
        {subtitle && (
          <span
            className="text-[10px] font-sans"
            style={{ color: dangerSubtitle ? 'var(--danger)' : 'var(--dim)' }}
          >
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function SummaryCell({ label, value, unit, accent, small }) {
  return (
    <div className="rounded-xl bg-surface border border-border p-2.5 text-center">
      <div className="text-dim text-[9px] font-sans mb-1">{label}</div>
      <div
        className={`font-display leading-tight ${small ? 'text-sm' : 'text-xl'}`}
        style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
      >
        {value}
      </div>
      {unit && <div className="text-dim text-[9px] font-sans">{unit}</div>}
    </div>
  )
}

function formatHour(h) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

function CravingTrendChart({ data }) {
  if (!data || data.length === 0) return null
  const max = 10
  const height = 60
  const w = 100 / (data.length - 1 || 1)

  const points = data.map((d, i) => ({
    x: i * w,
    y: height - (d.avg / max) * height,
    avg: d.avg,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const first = points[0]?.avg ?? 0
  const last = points[points.length - 1]?.avg ?? 0
  const delta = Math.round((last - first) * 10) / 10
  const improving = delta < 0

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: 64 }}
      >
        <path
          d={pathD}
          fill="none"
          stroke={improving ? 'var(--accent)' : 'var(--danger)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill={improving ? 'var(--accent)' : 'var(--danger)'}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px] font-sans" style={{ color: 'var(--dim)' }}>
          earliest · avg {first}/10
        </span>
        <span
          className="text-[10px] font-sans"
          style={{ color: improving ? 'var(--accent)' : 'var(--danger)' }}
        >
          {improving ? '↓' : '↑'} {Math.abs(delta)} — {improving ? 'getting easier' : 'still building'}
        </span>
        <span className="text-[10px] font-sans" style={{ color: 'var(--dim)' }}>
          recent · avg {last}/10
        </span>
      </div>
    </div>
  )
}
