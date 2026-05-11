// Horizontal bar chart for triggers / locations

export default function BarBreakdown({ items, color = 'var(--accent)' }) {
  if (!items?.length) {
    return <p className="text-dim text-xs font-mono">No data yet.</p>
  }

  const max = Math.max(...items.map((i) => i.count), 1)

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-text text-xs font-mono capitalize">{item.label}</span>
            <span className="text-muted text-xs font-mono">{item.count}</span>
          </div>
          <div className="h-[6px] rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: color,
                opacity: 0.3 + (item.count / max) * 0.7,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
