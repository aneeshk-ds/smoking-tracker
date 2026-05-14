// A label + value pair for the home screen secondary stats row

export default function StatBlock({ label, value, valueClass = '', subtitle }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-muted text-sm font-mono">{label}</span>
      <div className="text-right">
        <span className={`text-text text-sm font-mono ${valueClass}`}>{value}</span>
        {subtitle && (
          <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--dim)' }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
