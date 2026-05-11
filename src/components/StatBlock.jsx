// A label + value pair for the home screen secondary stats row

export default function StatBlock({ label, value, valueClass = '' }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-muted text-sm font-mono">{label}</span>
      <span className={`text-text text-sm font-mono ${valueClass}`}>{value}</span>
    </div>
  )
}
