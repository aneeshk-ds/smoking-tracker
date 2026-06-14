import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs font-sans">
      <div className="text-muted mb-1">{label}</div>
      <div className="text-accent">{payload[0]?.value} cigs</div>
    </div>
  )
}

export default function TrendChart({ data, dailyTarget }) {
  if (!data?.length) {
    return <p className="text-dim text-xs font-sans">No data yet.</p>
  }

  const formatted = data.map((d) => ({
    date: format(new Date(d.date), 'd MMM'),
    count: d.count,
  }))

  const maxVal = Math.max(...data.map((d) => d.count), dailyTarget ?? 0, 1)

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--dim)', fontSize: 9, fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'var(--dim)', fontSize: 9, fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, system-ui, sans-serif' }}
          tickLine={false}
          axisLine={false}
          domain={[0, maxVal + 1]}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />
        {dailyTarget != null && (
          <ReferenceLine
            y={dailyTarget}
            stroke="var(--danger)"
            strokeDasharray="4 3"
            strokeOpacity={0.6}
          />
        )}
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
