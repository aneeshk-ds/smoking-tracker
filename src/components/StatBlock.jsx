// A label + value pair for the home screen secondary stats row

export default function StatBlock({ label, value, valueClass = '', subtitle }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-muted text-sm font-sans">{label}</span>
      <div className="text-right">
        <span className={`text-text text-sm font-sans ${valueClass}`}>{value}</span>
        {subtitle && (
          <div className="text-[10px] font-sans mt-0.5" style={{ color: 'var(--dim)' }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
