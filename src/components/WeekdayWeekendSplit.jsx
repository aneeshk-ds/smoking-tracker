// Side-by-side weekday vs weekend stat blocks

export default function WeekdayWeekendSplit({ data }) {
  if (!data) return <p className="text-dim text-xs font-mono">No data yet.</p>

  const { weekday, weekend } = data
  const higher = weekday.avg > weekend.avg ? 'weekday' : weekend.avg > weekday.avg ? 'weekend' : null

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Weekdays"
        avg={weekday.avg}
        total={weekday.total}
        highlight={higher === 'weekday'}
      />
      <StatCard
        label="Weekends"
        avg={weekend.avg}
        total={weekend.total}
        highlight={higher === 'weekend'}
      />
    </div>
  )
}

function StatCard({ label, avg, total, highlight }) {
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        borderColor: highlight ? 'var(--danger)' : 'var(--border)',
        backgroundColor: highlight ? 'rgba(255,85,119,0.06)' : 'var(--surface-2)',
      }}
    >
      <div className="text-muted text-[10px] font-mono mb-1">{label}</div>
      <div
        className="font-display text-2xl"
        style={{ color: highlight ? 'var(--danger)' : 'var(--text)' }}
      >
        {avg}
      </div>
      <div className="text-dim text-[10px] font-mono">avg / day</div>
      <div className="text-muted text-[10px] font-mono mt-1">{total} total</div>
    </div>
  )
}
