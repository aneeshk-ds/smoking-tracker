// Generates a 1080x1350 share card PNG (Instagram portrait format).
// Uses the browser Canvas 2D API only — no external dependencies.

import { formatCurrency } from './format'

export async function generateShareCard({ month, totalSmoked, avgPerDay, totalSpent, currency, streak, goal }) {
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

  // Accent accent line at top
  ctx.fillStyle = '#00e5a0'
  ctx.fillRect(80, 90, 80, 3)

  // ── Header ──
  ctx.fillStyle = '#555555'
  ctx.font = '500 32px "JetBrains Mono", monospace'
  ctx.fillText('TRACKER', 80, 140)

  ctx.fillStyle = '#999999'
  ctx.font = '400 32px "JetBrains Mono", monospace'
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
  ctx.font = '300 280px "Fraunces", Georgia, serif'
  const numStr = String(totalSmoked)
  const numW = ctx.measureText(numStr).width
  ctx.fillText(numStr, (W - numW) / 2, 560)

  ctx.fillStyle = '#555555'
  ctx.font = '500 36px "JetBrains Mono", monospace'
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
    ctx.font = '300 80px "Fraunces", Georgia, serif'
    const vW = ctx.measureText(value).width
    ctx.fillText(value, cx - vW / 2, 820)

    ctx.fillStyle = '#555555'
    ctx.font = '500 28px "JetBrains Mono", monospace'
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
  ctx.font = '500 30px "JetBrains Mono", monospace'
  ctx.fillText(goalStr, 80, 980)
  if (streakStr) {
    const sw = ctx.measureText(streakStr).width
    ctx.fillText(streakStr, W - 80 - sw, 980)
  }

  // ── Accent bar ──
  ctx.fillStyle = '#00e5a0'
  ctx.fillRect(80, 1210, 80, 3)

  // ── Footer ──
  ctx.fillStyle = '#333345'
  ctx.font = '400 28px "JetBrains Mono", monospace'
  ctx.fillText('All data stays on your device.', 80, 1280)

  // Convert to PNG blob and download
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tracker-${month.replace(' ', '-').toLowerCase()}.png`
      a.click()
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}
