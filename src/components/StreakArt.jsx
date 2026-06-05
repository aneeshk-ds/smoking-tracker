/**
 * StreakArt — minimal line-art visuals that respond to the streak counters.
 *
 *   <Lung days={smokeFreeDays} />        thin-stroke lungs that fill with soft
 *                                        violet as smoke-free days grow.
 *   <BurningCigarette days={smokingDays} /> a slim cigarette: a single ember and
 *                                        one smoke curl, paper shortens as the
 *                                        smoking-day streak grows.
 *
 * Pure SVG, no dependencies. Tune *_FULL to change how many days reach the
 * fully-healed / fully-burnt look.
 */

const LUNG_FULL = 30
const CIG_FULL  = 12

function clamp01(x) { return Math.max(0, Math.min(1, x)) }
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
function lerpColor(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b)
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`
}

// One lobe, drawn for the right side; the left is the same path mirrored.
const LOBE = 'M25 17 C 26 23, 31 24, 35 29 C 38 33, 37 40, 32 41 C 28 41.5, 26 36, 25.6 29 C 25.3 24, 25 20, 25 17 Z'

export function Lung({ days = 0, size = 40 }) {
  const t = clamp01(days / LUNG_FULL)
  const line = lerpColor('#6B7280', '#A78BFA', t)
  const fillOpacity = 0.06 + 0.4 * t
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="lung health">
      {/* trachea + bronchi */}
      <path d="M24 8 L24 18 M24 17 C22.5 18.5, 22 18.8, 21 19.4 M24 17 C25.5 18.5, 26 18.8, 27 19.4"
        stroke={line} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* right lobe */}
      <path d={LOBE} fill="#A78BFA" fillOpacity={fillOpacity} stroke={line} strokeWidth="1.6" strokeLinejoin="round" />
      {/* left lobe (mirrored) */}
      <g transform="translate(48,0) scale(-1,1)">
        <path d={LOBE} fill="#A78BFA" fillOpacity={fillOpacity} stroke={line} strokeWidth="1.6" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

export function BurningCigarette({ days = 0, size = 40 }) {
  const active = days > 0
  const t = active ? clamp01(days / CIG_FULL) : 0
  const burn = active ? 0.1 + 0.82 * t : 0

  const yMid = 28
  const h = 4
  const tipX = 8 + burn * 22          // burning edge recedes as it burns
  const filterX = 40
  const paperW = filterX - tipX
  const ember = lerpColor('#F59E0B', '#EF4444', t)

  // one smoke curl, taller and clearer the longer the streak
  const smokeOpacity = 0.22 + t * 0.5
  const rise = 8 + t * 8
  const sx = tipX

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="smoking streak">
      {active && (
        <path
          d={`M${sx} ${yMid - h} C ${sx - 3} ${yMid - h - rise * 0.5}, ${sx + 3} ${yMid - h - rise * 0.8}, ${sx} ${yMid - h - rise}`}
          stroke="#9AA6B2" strokeWidth="1.5" strokeLinecap="round" opacity={smokeOpacity} fill="none" />
      )}
      {/* paper */}
      {paperW > 1 && (
        <rect x={tipX} y={yMid - h / 2} width={paperW} height={h} rx={h / 2}
          fill={active ? '#E9E7E1' : '#9AA6B2'} fillOpacity={active ? 1 : 0.5} />
      )}
      {/* ember tip */}
      {active && <circle cx={tipX} cy={yMid} r={1.7 + t * 0.8} fill={ember} />}
      {/* filter */}
      <rect x={filterX} y={yMid - h / 2} width="5" height={h} rx={h / 2}
        fill={active ? '#CDA15A' : '#7E8895'} fillOpacity={active ? 1 : 0.5} />
    </svg>
  )
}
