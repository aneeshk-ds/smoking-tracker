/**
 * StreakArt — two visuals that respond to the streak counters on the Home card.
 *
 *   <Lung days={smokeFreeDays} />        heals as smoke-free days grow:
 *                                        dull grey -> healthy violet, toxin
 *                                        spots clear, a soft glow appears.
 *
 *   <BurningCigarette days={smokingDays} /> burns further as the smoking-day
 *                                        streak grows: the paper shortens, the
 *                                        ember intensifies, more smoke rises.
 *
 * Both are pure SVG, no dependencies. Tune the *_FULL constants to change how
 * many days reach the fully-healed / fully-burnt look.
 */

const LUNG_FULL = 30   // days of smoke-free streak to reach full health
const CIG_FULL  = 12   // days of smoking streak to reach a fully-burnt look

function clamp01(x) { return Math.max(0, Math.min(1, x)) }

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function lerpColor(a, b, t) {
  const ca = hexToRgb(a), cb = hexToRgb(b)
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`
}

// Fixed toxin-spot positions inside the lobes; we show the first N of them.
const SPOTS = [
  [16, 30], [31, 28], [18, 38], [30, 39], [22, 33], [27, 35],
]

export function Lung({ days = 0, size = 40 }) {
  const t = clamp01(days / LUNG_FULL)
  const sick = '#5E6B79'        // dull grey-blue (unhealthy)
  const healthy = '#A78BFA'     // violet, matches the streak accent
  const fill = lerpColor(sick, healthy, t)
  const stroke = lerpColor('#46505C', '#C4B5FD', t)
  const spotCount = Math.round((1 - t) * 4)   // 4 -> 0 spots as health improves
  const glow = t > 0.45 ? (t - 0.45) * 0.9 : 0

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="lung health">
      {glow > 0 && (
        <ellipse cx="24" cy="32" rx="17" ry="15"
          fill="#A78BFA" opacity={glow * 0.25}
          style={{ filter: 'blur(4px)' }} />
      )}
      {/* trachea + bronchi */}
      <path d="M24 9 L24 20 M24 18 C24 18 20 19 18.5 22 M24 18 C24 18 28 19 29.5 22"
        stroke={stroke} strokeWidth="2.1" strokeLinecap="round" />
      {/* left lobe */}
      <path d="M21 21 C14 22 10 28 10 35 C10 41 13 44 17 43 C20.5 42 21.5 38 21.5 33 L21.5 22 C21.5 21.3 21 21 21 21 Z"
        fill={fill} stroke={stroke} strokeWidth="1.4" />
      {/* right lobe */}
      <path d="M27 21 C34 22 38 28 38 35 C38 41 35 44 31 43 C27.5 42 26.5 38 26.5 33 L26.5 22 C26.5 21.3 27 21 27 21 Z"
        fill={fill} stroke={stroke} strokeWidth="1.4" />
      {/* toxin spots fade out as the lung heals */}
      {SPOTS.slice(0, spotCount).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.9" fill="#2B3037" opacity="0.55" />
      ))}
    </svg>
  )
}

export function BurningCigarette({ days = 0, size = 40 }) {
  const active = days > 0
  const t = active ? clamp01(days / CIG_FULL) : 0
  const burn = active ? 0.12 + 0.82 * t : 0   // fraction of paper consumed

  // Geometry: cigarette lies horizontally. Filter (tan) on the right, paper to
  // the left, burning tip at the far left. As burn grows the left end recedes.
  const yMid = 30
  const h = 7
  const tipX = 8 + burn * 20            // left burning edge moves right as it burns
  const filterX = 38                    // start of the tan filter
  const paperW = filterX - tipX

  const emberColor = active ? lerpColor('#F59E0B', '#EF4444', t) : '#9AA6B2'
  const ashLen = active ? 2 + t * 3 : 0

  // Smoke wisps: more and stronger as the streak grows
  const wisps = active ? Math.min(3, 1 + Math.floor(t * 3)) : 0
  const smokeOpacity = 0.2 + t * 0.55

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="smoking streak">
      {/* smoke */}
      {Array.from({ length: wisps }).map((_, i) => {
        const x = tipX + i * 2.5
        const o = smokeOpacity * (1 - i * 0.22)
        return (
          <path key={i}
            d={`M${x} ${yMid - 4} C ${x - 3} ${yMid - 10}, ${x + 3} ${yMid - 14}, ${x} ${yMid - 20}`}
            stroke="#B8C2CC" strokeWidth="1.6" strokeLinecap="round" opacity={o} fill="none" />
        )
      })}

      {/* paper body */}
      {paperW > 1 && (
        <rect x={tipX} y={yMid - h / 2} width={paperW} height={h} rx="1.2"
          fill="#F4F1EA" stroke="#D8D2C4" strokeWidth="0.8" />
      )}
      {/* ash just behind the ember */}
      {active && ashLen > 0 && (
        <rect x={tipX} y={yMid - h / 2} width={ashLen} height={h} rx="1.2"
          fill="#8A8A8A" opacity="0.85" />
      )}
      {/* burning ember at the tip */}
      {active && (
        <>
          <rect x={tipX - 2.4} y={yMid - h / 2} width="2.6" height={h} rx="1.2" fill={emberColor} />
          <circle cx={tipX - 1} cy={yMid} r={1.6 + t * 1.2} fill={emberColor}
            opacity="0.9" style={{ filter: 'blur(0.6px)' }} />
        </>
      )}
      {/* tan filter */}
      <rect x={filterX} y={yMid - h / 2} width="6" height={h} rx="1.4"
        fill={active ? '#D8A24A' : '#A9966B'} stroke="#B07C2E" strokeWidth="0.6" />
      <line x1={filterX} y1={yMid - h / 2} x2={filterX} y2={yMid + h / 2}
        stroke="#B07C2E" strokeWidth="0.8" opacity="0.6" />
    </svg>
  )
}
