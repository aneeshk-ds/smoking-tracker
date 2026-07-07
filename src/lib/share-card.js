// Generates a 1080x1350 share card PNG (Instagram portrait format).
// Uses the browser Canvas 2D API only — no external dependencies.
// Fonts follow the app's SF Pro / system-sans stack for brand consistency.

import { formatCurrency } from './format'

// System SF-first stack. Canvas needs concrete family names; these resolve to
// SF Pro on Apple devices, Segoe UI / Roboto elsewhere, sans-serif as a floor.
const SANS = '-apple-system, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, system-ui, sans-serif'

// Draw the card onto a canvas and return a PNG Blob (no side effects).
export async function renderShareCardBlob({ month, totalSmoked, avgPerDay, totalSpent, currency, streak, goal }) {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Background ──
  ctx.fillStyle = '#07070f'
  ctx.fillRect(0, 0, W, H)

  // Subtle dot grid pattern
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let x = 0; x < W; x += 48) {
    for (let y = 0; y < H; y += 48) {
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Accent line at top
  ctx.fillStyle = '#00e5a0'
  ctx.fillRect(80, 90, 80, 3)

  // ── Header ──
  ctx.fillStyle = '#777788'
  ctx.font = `600 32px ${SANS}`
  ctx.fillText('TRACKER', 80, 140)

  ctx.fillStyle = '#999999'
  ctx.font = `400 32px ${SANS}`
  ctx.fillText(month, W - 80 - ctx.measureText(month).width, 140)

  // Divider
  ctx.strokeStyle = '#1f1f35'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 170)
  ctx.lineTo(W - 80, 170)
  ctx.stroke()

  // ── Primary number ──
  ctx.fillStyle = '#f0f0f8'
  ctx.font = `200 280px ${SANS}`
  const numStr = String(totalSmoked)
  const numW = ctx.measureText(numStr).width
  ctx.fillText(numStr, (W - numW) / 2, 560)

  ctx.fillStyle = '#777788'
  ctx.font = `500 36px ${SANS}`
  const cigLabel = `cigarette${totalSmoked !== 1 ? 's' : ''} this month`
  const cigW = ctx.measureText(cigLabel).width
  ctx.fillText(cigLabel, (W - cigW) / 2, 630)

  // ── Stats row ──
  const stats = [
    { label: 'avg / day', value: String(avgPerDay) },
    { label: 'spent', value: formatCurrency(totalSpent, currency) },
  ]

  const colW = (W - 160) / stats.length
  stats.forEach(({ label, value }, i) => {
    const cx = 80 + i * colW + colW / 2
    ctx.fillStyle = '#f0f0f8'
    ctx.font = `200 80px ${SANS}`
    const vW = ctx.measureText(value).width
    ctx.fillText(value, cx - vW / 2, 820)

    ctx.fillStyle = '#777788'
    ctx.font = `500 28px ${SANS}`
    const lW = ctx.measureText(label).width
    ctx.fillText(label, cx - lW / 2, 870)
  })

  // Divider 2
  ctx.strokeStyle = '#1f1f35'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 920)
  ctx.lineTo(W - 80, 920)
  ctx.stroke()

  // ── Goal + streak row ──
  const goalStr = `goal: ${goal}`
  const streakStr = streak ? `streak: ${streak}` : ''
  ctx.fillStyle = '#999999'
  ctx.font = `500 30px ${SANS}`
  ctx.fillText(goalStr, 80, 980)
  if (streakStr) {
    const sw = ctx.measureText(streakStr).width
    ctx.fillText(streakStr, W - 80 - sw, 980)
  }

  // ── Accent bar ──
  ctx.fillStyle = '#00e5a0'
  ctx.fillRect(80, 1210, 80, 3)

  // ── Footer ──
  ctx.fillStyle = '#444455'
  ctx.font = `400 28px ${SANS}`
  ctx.fillText('All data stays on your device.', 80, 1280)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

// Trigger a plain file download of a blob.
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Public entry point. Renders the card, then:
//  1. On devices that support sharing files (most phones), opens the native
//     share sheet so the image can go straight to WhatsApp/Messages/etc.
//  2. Otherwise (or if the user cancels), downloads the PNG.
// Returns 'shared' | 'downloaded'.
export async function generateShareCard(meta) {
  const blob = await renderShareCardBlob(meta)
  const filename = `tracker-${String(meta.month).replace(/\s+/g, '-').toLowerCase()}.png`
  const file = new File([blob], filename, { type: 'image/png' })

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: 'My tracker',
        text: `${meta.totalSmoked} cigarettes this month.`,
      })
      return 'shared'
    } catch (e) {
      // User dismissed the sheet, or share failed — fall through to download.
      if (e && e.name === 'AbortError') return 'shared'
    }
  }

  downloadBlob(blob, filename)
  return 'downloaded'
}
