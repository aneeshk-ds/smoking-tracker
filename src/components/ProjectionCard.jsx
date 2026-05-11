import { formatCurrency } from '../lib/format'
import { getEquivalents } from '../lib/equivalents'

const YEARS = [1, 5, 10]

export default function ProjectionCard({ dailyCost, currency = 'INR' }) {
  if (!dailyCost) {
    return <p className="text-dim text-xs font-mono">Log costs to see projections.</p>
  }

  const projections = YEARS.map((y) => ({
    years: y,
    amount: dailyCost * 365 * y,
  }))

  const tenYr = projections[2].amount
  const equivalents = getEquivalents(tenYr, currency)
  const topEq = equivalents[0]

  return (
    <div className="flex flex-col gap-3">
      {/* 1yr / 5yr / 10yr row */}
      <div className="grid grid-cols-3 gap-2">
        {projections.map(({ years, amount }) => (
          <div key={years} className="rounded-xl p-3 bg-surface-2 border border-border text-center">
            <div className="text-dim text-[10px] font-mono mb-1">{years} yr</div>
            <div
              className="font-display text-base leading-tight"
              style={{ color: 'var(--danger)' }}
            >
              {formatCurrency(amount, currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Equivalent callout */}
      {topEq && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: 'rgba(255,85,119,0.08)', border: '1px solid rgba(255,85,119,0.2)' }}
        >
          <span className="text-danger text-lg">≈</span>
          <div>
            <div className="text-text text-xs font-mono">
              {topEq.count} {topEq.item}{topEq.count !== 1 ? 's' : ''}
            </div>
            <div className="text-muted text-[10px] font-mono">over 10 years at this rate</div>
          </div>
        </div>
      )}
    </div>
  )
}
