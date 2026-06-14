// 7-row (days of week) x 24-col (hours) frequency heatmap

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p']

export default function Heatmap({ grid }) {
  if (!grid || !grid.length) {
    return <p className="text-dim text-xs font-sans">No data yet.</p>
  }

  const maxVal = Math.max(1, ...grid.flat())

  // Find peak hour label
  let peakDay = 0, peakHour = 0, peakCount = 0
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (grid[d][h] > peakCount) {
        peakCount = grid[d][h]
        peakDay = d
        peakHour = h
      }
    }
  }
  const peakLabel = peakCount > 0
    ? `Peak: ${DAYS[peakDay]} ${formatHour(peakHour)}`
    : null

  return (
    <div>
      {/* Hour axis labels */}
      <div className="flex mb-1 ml-8">
        {HOUR_LABELS.map((l, i) => (
          <span key={i} className="text-dim text-[9px] font-sans flex-1 text-center">{l}</span>
        ))}
      </div>

      {/* Grid rows */}
      {grid.map((row, dayIdx) => (
        <div key={dayIdx} className="flex items-center gap-[2px] mb-[2px]">
          <span className="text-dim text-[9px] font-sans w-7 text-right pr-1 shrink-0">
            {DAYS[dayIdx]}
          </span>
          {row.map((val, hourIdx) => {
            const intensity = val / maxVal
            return (
              <div
                key={hourIdx}
                title={`${DAYS[dayIdx]} ${formatHour(hourIdx)}: ${val}`}
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor:
                    val === 0
                      ? 'var(--surface-2)'
                      : `rgba(0,229,160,${0.15 + intensity * 0.85})`,
                }}
              />
            )
          })}
        </div>
      ))}

      {peakLabel && (
        <p className="text-dim text-[10px] font-sans mt-2">{peakLabel}</p>
      )}
    </div>
  )
}

function formatHour(h) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}
